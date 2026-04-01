import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    ARTEMIS_LAUNCH_DATE,
    generateArtemisTrajectory,
} from "@/data/artemisData";
import { getCategoryColor } from "@/lib/utils";
import {
    fetchTLEDataWithFallback,
    getMockLaunchSites,
    getMockSatellites,
} from "@/services/satelliteApi";
import type {
    ArtemisMissionPhase,
    Satellite,
    TrajectoryWaypoint,
} from "@/types";
import { getMoonPosition } from "@/utils/moonPosition";
import Globe from "globe.gl";
import {
    Eye,
    EyeOff,
    MapPin,
    RefreshCw,
    Rocket,
    Satellite as SatelliteIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

interface GlobeVisualizationProps {
    className?: string;
    showArtemisTrajectory?: boolean;
    currentMissionPhase?: ArtemisMissionPhase;
}

// Globe data types are inferred from the globe library's generic parameters

interface ArcData {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    altitude: number;
    phase: ArtemisMissionPhase;
}

// Phase color mapping
const PHASE_COLORS: Record<ArtemisMissionPhase, string> = {
    "pre-launch": "#9ca3af",
    ascent: "#9ca3af",
    "earth-orbit": "#3b82f6",
    translunar: "#f97316",
    "lunar-flyby": "#eab308",
    return: "#22c55e",
    reentry: "#ef4444",
    splashdown: "#a855f7",
};

// Artistic scaling constants for Moon visualization
const VISUAL_MOON_DISTANCE = 4; // Earth radii
const VISUAL_MOON_SIZE = 0.15; // Earth radii

/**
 * Convert trajectory waypoints into arc segments for Globe.gl arcsData layer.
 * Each consecutive pair of waypoints becomes one arc.
 */
function trajectoryToArcs(waypoints: TrajectoryWaypoint[]): ArcData[] {
    const arcs: ArcData[] = [];
    const LUNAR_DISTANCE_KM = 384400;
    for (let i = 0; i < waypoints.length - 1; i++) {
        const start = waypoints[i];
        const end = waypoints[i + 1];
        // Scale altitude to match Moon's visual distance
        const avgAlt =
            ((start.alt + end.alt) / 2 / LUNAR_DISTANCE_KM) *
            VISUAL_MOON_DISTANCE;
        arcs.push({
            startLat: start.lat,
            startLng: start.lng,
            endLat: end.lat,
            endLng: end.lng,
            color: PHASE_COLORS[end.phase],
            altitude: Math.min(avgAlt, VISUAL_MOON_DISTANCE * 1.1),
            phase: end.phase,
        });
    }
    return arcs;
}

/**
 * Phase duration thresholds in milliseconds, matching getMissionPhase logic.
 * Used to compute how far through a phase the mission currently is.
 */
const PHASE_START_MS: Record<ArtemisMissionPhase, number> = {
    "pre-launch": -Infinity,
    ascent: 0,
    "earth-orbit": 8.1 * 60 * 1000,
    translunar: 90 * 60 * 1000,
    "lunar-flyby": 3.5 * 24 * 60 * 60 * 1000,
    return: 5 * 24 * 60 * 60 * 1000,
    reentry: 9.5 * 24 * 60 * 60 * 1000,
    splashdown: 10 * 24 * 60 * 60 * 1000,
};

const PHASE_END_MS: Record<ArtemisMissionPhase, number> = {
    "pre-launch": 0,
    ascent: 8.1 * 60 * 1000,
    "earth-orbit": 90 * 60 * 1000,
    translunar: 3.5 * 24 * 60 * 60 * 1000,
    "lunar-flyby": 5 * 24 * 60 * 60 * 1000,
    return: 9.5 * 24 * 60 * 60 * 1000,
    reentry: 10 * 24 * 60 * 60 * 1000,
    splashdown: 11 * 24 * 60 * 60 * 1000,
};

/**
 * Get the Orion spacecraft position along the trajectory based on real mission elapsed time.
 * Uses the launch date to compute how far through the current phase the mission is,
 * then picks the corresponding waypoint along the trajectory.
 */
function getOrionPosition(
    waypoints: TrajectoryWaypoint[],
    phase: ArtemisMissionPhase,
    launchDate: Date,
): TrajectoryWaypoint | null {
    // Pre-launch and ascent: show Orion at KSC launch pad
    if (phase === "pre-launch" || phase === "ascent") {
        return { lat: 28.5721, lng: -80.648, alt: 0, phase };
    }

    if (waypoints.length === 0) return null;

    // Find waypoints matching the current phase
    const phaseWaypoints = waypoints.filter((w) => w.phase === phase);
    if (phaseWaypoints.length > 0) {
        // Compute progress through the current phase based on real elapsed time
        const elapsedMs = Date.now() - launchDate.getTime();
        const phaseStart = PHASE_START_MS[phase];
        const phaseEnd = PHASE_END_MS[phase];
        const phaseDuration = phaseEnd - phaseStart;

        // Clamp progress to [0, 1]
        const progress =
            phaseDuration > 0
                ? Math.max(
                      0,
                      Math.min(1, (elapsedMs - phaseStart) / phaseDuration),
                  )
                : 0;

        const idx = Math.floor(progress * (phaseWaypoints.length - 1));
        return phaseWaypoints[Math.min(idx, phaseWaypoints.length - 1)];
    }

    // Fallback: use the last waypoint
    return waypoints[waypoints.length - 1];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstanceType = any;

export function GlobeVisualization({
    className,
    showArtemisTrajectory = false,
    currentMissionPhase,
}: GlobeVisualizationProps) {
    const globeRef = useRef<HTMLDivElement>(null);
    const globeInstanceRef = useRef<GlobeInstanceType>(null);
    const [satellites, setSatellites] = useState<Satellite[]>(() =>
        getMockSatellites(),
    );
    const [launchSites] = useState(getMockLaunchSites());
    const [selectedSatellite, setSelectedSatellite] =
        useState<Satellite | null>(null);
    const [showOrbits, setShowOrbits] = useState(true);
    const [showSatellites, setShowSatellites] = useState(true);
    const [showLaunchSites, setShowLaunchSites] = useState(true);
    const [showArtemis, setShowArtemis] = useState(showArtemisTrajectory);
    const [categoryFilter, setCategoryFilter] = useState<string>("all");

    // Moon position state — updates every 60 seconds
    const [moonPos, setMoonPos] = useState(() => getMoonPosition(new Date()));

    // Orion marker animation tick
    const [, setOrionTick] = useState(0);

    // Load real satellite data from CelesTrak
    useEffect(() => {
        let cancelled = false;
        const groups = ["stations", "starlink", "gps-ops", "weather", "geo"];
        Promise.all(groups.map((g) => fetchTLEDataWithFallback(g)))
            .then((results) => {
                if (!cancelled) {
                    const live = results.flat();
                    if (live.length > 0) {
                        setSatellites(live);
                    }
                }
            })
            .catch(() => {
                // keep mock data on failure
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Build positions map from satellite data (positions come from the fetch)
    const positions = useMemo(() => {
        const map = new Map<
            string,
            {
                latitude: number;
                longitude: number;
                altitude: number;
                velocity: number;
            }
        >();
        for (const sat of satellites) {
            if (sat.position) {
                map.set(sat.id, sat.position);
            }
        }
        return map;
    }, [satellites]);

    const filteredSatellites = satellites.filter(
        (sat) => categoryFilter === "all" || sat.category === categoryFilter,
    );

    // Generate trajectory waypoints based on current mission phase
    const phase = currentMissionPhase ?? "pre-launch";
    const trajectory = useMemo(() => {
        if (!showArtemis) return [];
        // No trajectory to show before launch
        if (phase === "pre-launch") return [];
        return generateArtemisTrajectory(phase);
    }, [showArtemis, phase]);

    // Convert trajectory to arc segments
    const arcData = useMemo(() => {
        if (!showArtemis || trajectory.length < 2) return [];
        return trajectoryToArcs(trajectory);
    }, [showArtemis, trajectory]);

    // Moon position update interval (every 60 seconds)
    useEffect(() => {
        if (!showArtemis) return;
        const interval = setInterval(() => {
            setMoonPos(getMoonPosition(new Date()));
        }, 60_000);
        return () => clearInterval(interval);
    }, [showArtemis]);

    // Orion marker position update interval (every 30 seconds for real-time tracking)
    useEffect(() => {
        if (!showArtemis) return;
        const interval = setInterval(() => {
            setOrionTick((t) => t + 1);
        }, 30_000);
        return () => clearInterval(interval);
    }, [showArtemis]);

    const initGlobe = useCallback(() => {
        if (!globeRef.current || globeInstanceRef.current) return;

        const container = globeRef.current;

        // Defer init until container has actual dimensions (Suspense/lazy can cause 0-size at mount)
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            requestAnimationFrame(() => initGlobe());
            return;
        }

        const globe = Globe()(container)
            .width(container.clientWidth)
            .height(container.clientHeight)
            .globeImageUrl(
                "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
            )
            .bumpImageUrl(
                "https://unpkg.com/three-globe/example/img/earth-topology.png",
            )
            .backgroundImageUrl(
                "https://unpkg.com/three-globe/example/img/night-sky.png",
            )
            .showAtmosphere(true)
            .atmosphereColor("#3a228a")
            .atmosphereAltitude(0.25)
            .pointOfView({ lat: 30, lng: -30, altitude: 2.5 });

        globe.controls().autoRotate = false;
        globe.controls().enableZoom = true;
        globe.controls().enablePan = true;

        globeInstanceRef.current = globe;
    }, []);

    useEffect(() => {
        initGlobe();

        const container = globeRef.current;
        if (!container) return;

        const resizeObserver = new ResizeObserver(() => {
            if (!globeInstanceRef.current) {
                // Globe hasn't initialized yet — try again now that container may have dimensions
                initGlobe();
                return;
            }
            globeInstanceRef.current
                .width(container.clientWidth)
                .height(container.clientHeight);
        });
        resizeObserver.observe(container);

        return () => {
            resizeObserver.disconnect();
            if (globeInstanceRef.current) {
                globeInstanceRef.current._destructor?.();
                globeInstanceRef.current = null;
            }
        };
    }, [initGlobe]);

    // Main effect: update all globe layers
    useEffect(() => {
        if (!globeInstanceRef.current) return;

        const globe = globeInstanceRef.current;

        // Launch sites — inject as Three.js Points (constant dots, no pulse)
        {
            const scene = globe.scene();
            const GLOBE_RADIUS = 100;

            const prevSites = scene.getObjectByName("launchSitePoints");
            if (prevSites) scene.remove(prevSites);

            // Clear labels layer
            globe.labelsData([]);

            if (showLaunchSites && launchSites.length > 0) {
                const positions: number[] = [];
                const siteIndex: typeof launchSites = [];

                for (const site of launchSites) {
                    const lat = site.lat * (Math.PI / 180);
                    const lng = site.lng * (Math.PI / 180);
                    const r = GLOBE_RADIUS * 1.005; // just above surface

                    positions.push(
                        r * Math.cos(lat) * Math.sin(lng),
                        r * Math.sin(lat),
                        r * Math.cos(lat) * Math.cos(lng),
                    );
                    siteIndex.push(site);
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(positions, 3),
                );

                const canvas = document.createElement("canvas");
                canvas.width = 32;
                canvas.height = 32;
                const ctx = canvas.getContext("2d")!;
                ctx.beginPath();
                ctx.arc(16, 16, 14, 0, Math.PI * 2);
                ctx.fillStyle = "white";
                ctx.fill();

                const material = new THREE.PointsMaterial({
                    size: 4,
                    color: 0xef4444,
                    sizeAttenuation: true,
                    transparent: true,
                    opacity: 0.95,
                    map: new THREE.CanvasTexture(canvas),
                    alphaTest: 0.5,
                });

                const pts = new THREE.Points(geometry, material);
                pts.name = "launchSitePoints";
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (pts as any).__siteIndex = siteIndex;
                scene.add(pts);
            }
        }

        // Satellites — inject directly into Three.js scene as a Points buffer
        // This bypasses globe.gl layers entirely for clean floating dots
        {
            const scene = globe.scene();
            const GLOBE_RADIUS = 100; // globe.gl uses radius=100

            // Remove previous satellite points group if it exists
            const prevGroup = scene.getObjectByName("satellitePoints");
            if (prevGroup) scene.remove(prevGroup);

            // Clear pointsData to avoid cylinders
            globe.pointsData([]);

            if (showSatellites && filteredSatellites.length > 0) {
                const positions: number[] = [];
                const colors: number[] = [];
                // Store satellite refs for raycaster hover lookup
                const satIndex: typeof filteredSatellites = [];

                for (const sat of filteredSatellites) {
                    if (!sat.position) continue;
                    const lat = sat.position.latitude * (Math.PI / 180);
                    const lng = sat.position.longitude * (Math.PI / 180);
                    // Scale altitude for visual effect
                    const altScale =
                        Math.min(sat.position.altitude / 6371, 0.35) + 0.02;
                    const r = GLOBE_RADIUS * (1 + altScale);

                    // Convert lat/lng/alt to x,y,z (globe.gl coordinate system)
                    const x = r * Math.cos(lat) * Math.sin(lng);
                    const y = r * Math.sin(lat);
                    const z = r * Math.cos(lat) * Math.cos(lng);

                    // Skip NaN positions to avoid Three.js errors
                    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;

                    positions.push(x, y, z);
                    satIndex.push(sat);

                    const color = new THREE.Color(
                        getCategoryColor(sat.category),
                    );
                    colors.push(color.r, color.g, color.b);
                }

                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute(
                    "position",
                    new THREE.Float32BufferAttribute(positions, 3),
                );
                geometry.setAttribute(
                    "color",
                    new THREE.Float32BufferAttribute(colors, 3),
                );

                const material = new THREE.PointsMaterial({
                    size: 2.5,
                    vertexColors: true,
                    sizeAttenuation: true,
                    transparent: true,
                    opacity: 0.9,
                    map: (() => {
                        const canvas = document.createElement("canvas");
                        canvas.width = 32;
                        canvas.height = 32;
                        const ctx = canvas.getContext("2d")!;
                        ctx.beginPath();
                        ctx.arc(16, 16, 14, 0, Math.PI * 2);
                        ctx.fillStyle = "white";
                        ctx.fill();
                        const tex = new THREE.CanvasTexture(canvas);
                        return tex;
                    })(),
                    alphaTest: 0.5,
                });

                const points = new THREE.Points(geometry, material);
                points.name = "satellitePoints";
                // Attach satellite data for raycaster lookup
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (points as any).__satIndex = satIndex;
                scene.add(points);
            }
        }

        // Custom layer: Moon + Orion only
        {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const customData: any[] = [];

            // Add Moon + Orion if Artemis trajectory is active
            if (showArtemis) {
                const orionPos = getOrionPosition(
                    trajectory,
                    phase,
                    ARTEMIS_LAUNCH_DATE,
                );

                customData.push({
                    id: "moon",
                    lat: moonPos.lat,
                    lng: moonPos.lng,
                    alt: VISUAL_MOON_DISTANCE,
                    type: "moon",
                });

                if (orionPos) {
                    // Scale Orion's altitude into the same visual space as the Moon.
                    // Real lunar distance ~384,400 km maps to VISUAL_MOON_DISTANCE (4 Earth radii).
                    // Low orbit (~200 km) stays close to the surface (~0.03 Earth radii).
                    const LUNAR_DISTANCE_KM = 384400;
                    const visualAlt =
                        (orionPos.alt / LUNAR_DISTANCE_KM) *
                        VISUAL_MOON_DISTANCE;
                    // Clamp: minimum just above surface, maximum slightly past the Moon
                    const clampedAlt = Math.max(
                        0.03,
                        Math.min(visualAlt, VISUAL_MOON_DISTANCE * 1.1),
                    );

                    customData.push({
                        id: "orion",
                        lat: orionPos.lat,
                        lng: orionPos.lng,
                        alt: clampedAlt,
                        type: "orion",
                    });
                }
            }

            globe
                .customLayerData(customData)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .customThreeObject((d: any) => {
                    if (d.type === "moon") {
                        const geometry = new THREE.SphereGeometry(
                            VISUAL_MOON_SIZE * 50,
                            16,
                            16,
                        );
                        const material = new THREE.MeshBasicMaterial({
                            color: 0xc8c8c8,
                        });
                        return new THREE.Mesh(geometry, material);
                    }
                    if (d.type === "orion") {
                        const group = new THREE.Group();

                        // Core marker — bright orange sphere
                        const core = new THREE.Mesh(
                            new THREE.SphereGeometry(3.5, 12, 12),
                            new THREE.MeshBasicMaterial({ color: 0xf97316 }),
                        );
                        group.add(core);

                        // Outer glow ring for visibility
                        const glow = new THREE.Mesh(
                            new THREE.RingGeometry(5, 8, 32),
                            new THREE.MeshBasicMaterial({
                                color: 0xf97316,
                                transparent: true,
                                opacity: 0.45,
                                side: THREE.DoubleSide,
                            }),
                        );
                        group.add(glow);

                        // Pulsing halo
                        const halo = new THREE.Mesh(
                            new THREE.RingGeometry(8, 10, 32),
                            new THREE.MeshBasicMaterial({
                                color: 0xfbbf24,
                                transparent: true,
                                opacity: 0.25,
                                side: THREE.DoubleSide,
                            }),
                        );
                        group.add(halo);

                        // Text label using sprite
                        const canvas = document.createElement("canvas");
                        canvas.width = 256;
                        canvas.height = 64;
                        const ctx = canvas.getContext("2d")!;
                        ctx.fillStyle = "rgba(0,0,0,0.7)";
                        ctx.roundRect(0, 0, 256, 64, 8);
                        ctx.fill();
                        ctx.font = "bold 28px sans-serif";
                        ctx.fillStyle = "#f97316";
                        ctx.textAlign = "center";
                        ctx.fillText("🚀 Orion", 128, 42);
                        const texture = new THREE.CanvasTexture(canvas);
                        const spriteMat = new THREE.SpriteMaterial({
                            map: texture,
                            transparent: true,
                        });
                        const sprite = new THREE.Sprite(spriteMat);
                        sprite.scale.set(24, 6, 1);
                        sprite.position.set(0, 12, 0);
                        group.add(sprite);

                        return group;
                    }
                    return new THREE.Object3D();
                })
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                .customThreeObjectUpdate((obj: any, d: any) => {
                    // Convert lat/lng/alt to 3D position
                    const GLOBE_RADIUS = 100;
                    const lat = d.lat * (Math.PI / 180);
                    const lng = d.lng * (Math.PI / 180);
                    const r = GLOBE_RADIUS * (1 + (d.alt || 0));

                    obj.position.x = r * Math.cos(lat) * Math.sin(lng);
                    obj.position.y = r * Math.sin(lat);
                    obj.position.z = r * Math.cos(lat) * Math.cos(lng);
                });
        }

        // Orbit rings — rendered as Three.js line loops in the scene
        {
            const scene = globe.scene();
            const GLOBE_RADIUS = 100;

            // Remove previous orbit rings
            const prevOrbits = scene.getObjectByName("orbitRings");
            if (prevOrbits) scene.remove(prevOrbits);

            // Clear globe.gl paths layer
            globe.pathsData([]);

            if (showOrbits && showSatellites && filteredSatellites.length > 0) {
                const group = new THREE.Group();
                group.name = "orbitRings";

                // Pick a representative subset — one per unique altitude band + inclination
                const seen = new Set<string>();
                const orbitSats: typeof filteredSatellites = [];
                for (const sat of filteredSatellites) {
                    if (!sat.position) continue;
                    // Bucket by altitude (100km bands) and inclination proxy (category)
                    const altBand =
                        Math.round(sat.position.altitude / 200) * 200;
                    const key = `${altBand}-${sat.category}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        orbitSats.push(sat);
                    }
                    if (orbitSats.length >= 20) break; // limit for performance
                }

                for (const sat of orbitSats) {
                    if (!sat.position) continue;
                    const altScale =
                        Math.min(sat.position.altitude / 6371, 0.35) + 0.02;
                    const r = GLOBE_RADIUS * (1 + altScale);

                    // Approximate inclination from latitude
                    const inclination =
                        Math.abs(sat.position.latitude) * (Math.PI / 180) * 1.2;
                    const raan = sat.position.longitude * (Math.PI / 180);

                    const points: THREE.Vector3[] = [];
                    const segments = 128;
                    for (let i = 0; i <= segments; i++) {
                        const angle = (i / segments) * Math.PI * 2;
                        // Orbit in XZ plane, then tilt by inclination and rotate by RAAN
                        let x = r * Math.cos(angle);
                        let y = 0;
                        let z = r * Math.sin(angle);

                        // Tilt by inclination (rotate around X axis)
                        const y1 =
                            y * Math.cos(inclination) -
                            z * Math.sin(inclination);
                        const z1 =
                            y * Math.sin(inclination) +
                            z * Math.cos(inclination);
                        y = y1;
                        z = z1;

                        // Rotate by RAAN (rotate around Y axis)
                        const x2 = x * Math.cos(raan) + z * Math.sin(raan);
                        const z2 = -x * Math.sin(raan) + z * Math.cos(raan);
                        x = x2;
                        z = z2;

                        points.push(new THREE.Vector3(x, y, z));
                    }

                    const geometry = new THREE.BufferGeometry().setFromPoints(
                        points,
                    );
                    const color = new THREE.Color(
                        getCategoryColor(sat.category),
                    );
                    const material = new THREE.LineBasicMaterial({
                        color,
                        transparent: true,
                        opacity: 0.25,
                    });
                    const line = new THREE.LineLoop(geometry, material);
                    group.add(line);
                }

                scene.add(group);
            }
        }

        // Artemis trajectory arcs
        if (showArtemis && arcData.length > 0) {
            globe
                .arcsData(arcData)
                .arcStartLat("startLat")
                .arcStartLng("startLng")
                .arcEndLat("endLat")
                .arcEndLng("endLng")
                .arcColor("color")
                .arcAltitude((d: ArcData) => d.altitude)
                .arcStroke(1.5)
                .arcDashLength(0.4)
                .arcDashGap(0.2)
                .arcDashAnimateTime(2000);
        } else {
            globe.arcsData([]);
        }
    }, [
        satellites,
        filteredSatellites,
        positions,
        launchSites,
        showSatellites,
        showLaunchSites,
        showOrbits,
        selectedSatellite,
        showArtemis,
        arcData,
        moonPos,
        currentMissionPhase,
        trajectory,
    ]);

    // Raycaster for satellite hover tooltips
    useEffect(() => {
        const container = globeRef.current;
        const globe = globeInstanceRef.current;
        if (!container || !globe) return;

        const raycaster = new THREE.Raycaster();
        raycaster.params.Points = { threshold: 3 };
        const mouse = new THREE.Vector2();

        // Create tooltip element
        const tooltip = document.createElement("div");
        tooltip.style.cssText =
            "position:fixed;pointer-events:none;z-index:9999;display:none;" +
            "background:rgba(0,0,0,0.85);color:white;padding:8px 12px;" +
            "border-radius:6px;font-size:12px;line-height:1.5;max-width:220px;";
        document.body.appendChild(tooltip);

        const onMouseMove = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const camera = globe.camera();
            const scene = globe.scene();
            raycaster.setFromCamera(mouse, camera);

            const pointsObj = scene.getObjectByName("satellitePoints");
            const sitesObj = scene.getObjectByName("launchSitePoints");

            // Check launch sites first (higher priority, fewer objects)
            if (sitesObj) {
                const siteHits = raycaster.intersectObject(sitesObj);
                if (siteHits.length > 0 && siteHits[0].index !== undefined) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const site = (sitesObj as any).__siteIndex?.[
                        siteHits[0].index
                    ];
                    if (site) {
                        tooltip.innerHTML =
                            `<div style="font-weight:bold;margin-bottom:4px;color:#ef4444;">${site.name}</div>` +
                            `<div>Country: ${site.country}</div>` +
                            `<div>Total Launches: ${site.launches}</div>` +
                            `<div>Lat: ${site.lat.toFixed(4)}°, Lng: ${site.lng.toFixed(4)}°</div>`;
                        tooltip.style.borderLeft = "3px solid #ef4444";
                        tooltip.style.display = "block";
                        tooltip.style.left = event.clientX + 14 + "px";
                        tooltip.style.top = event.clientY + 14 + "px";
                        container.style.cursor = "pointer";
                        return;
                    }
                }
            }

            if (!pointsObj) {
                tooltip.style.display = "none";
                return;
            }

            const intersects = raycaster.intersectObject(pointsObj);
            if (intersects.length > 0 && intersects[0].index !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const satArr = (pointsObj as any).__satIndex;
                const sat = satArr?.[intersects[0].index];
                if (sat?.position) {
                    const catColor = getCategoryColor(sat.category);
                    tooltip.innerHTML =
                        `<div style="font-weight:bold;margin-bottom:4px;color:${catColor};">${sat.name}</div>` +
                        `<div>Category: <span style="text-transform:capitalize">${sat.category}</span></div>` +
                        `<div>NORAD ID: ${sat.noradId}</div>` +
                        `<div>Altitude: ${sat.position.altitude.toFixed(1)} km</div>` +
                        `<div>Velocity: ${sat.position.velocity.toFixed(2)} km/s</div>`;
                    tooltip.style.borderLeft = `3px solid ${catColor}`;
                    tooltip.style.display = "block";
                    tooltip.style.left = event.clientX + 14 + "px";
                    tooltip.style.top = event.clientY + 14 + "px";
                    container.style.cursor = "pointer";
                } else {
                    tooltip.style.display = "none";
                    container.style.cursor = "";
                }
            } else {
                tooltip.style.display = "none";
                container.style.cursor = "";
            }
        };

        const onClick = (event: MouseEvent) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            const camera = globe.camera();
            const scene = globe.scene();
            raycaster.setFromCamera(mouse, camera);

            const pointsObj = scene.getObjectByName("satellitePoints");
            if (!pointsObj) return;

            const intersects = raycaster.intersectObject(pointsObj);
            if (intersects.length > 0 && intersects[0].index !== undefined) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const sat = (pointsObj as any).__satIndex?.[
                    intersects[0].index
                ];
                if (sat) {
                    setSelectedSatellite(sat);
                    if (sat.position && globeInstanceRef.current) {
                        globeInstanceRef.current.pointOfView(
                            {
                                lat: sat.position.latitude,
                                lng: sat.position.longitude,
                                altitude: 1.5,
                            },
                            1000,
                        );
                    }
                }
            }
        };

        container.addEventListener("mousemove", onMouseMove);
        container.addEventListener("click", onClick);

        return () => {
            container.removeEventListener("mousemove", onMouseMove);
            container.removeEventListener("click", onClick);
            tooltip.remove();
        };
    }, [filteredSatellites, showSatellites]);

    const handleResetView = () => {
        globeInstanceRef.current?.pointOfView(
            { lat: 30, lng: -30, altitude: 2.5 },
            1000,
        );
    };

    const handleFocusSatellite = (satellite: Satellite) => {
        const pos = positions.get(satellite.id);
        if (pos && globeInstanceRef.current) {
            globeInstanceRef.current.pointOfView(
                { lat: pos.latitude, lng: pos.longitude, altitude: 0.5 },
                1000,
            );
        }
    };

    return (
        <div className={`relative ${className}`}>
            <div className="absolute top-4 left-4 z-10 space-y-2">
                <Card className="glass-effect">
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <SatelliteIcon className="h-4 w-4" />
                            Globe Controls
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 space-y-3">
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-40 h-8 text-xs">
                                <SelectValue placeholder="Filter category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>
                                <SelectItem value="iss">ISS</SelectItem>
                                <SelectItem value="starlink">
                                    Starlink
                                </SelectItem>
                                <SelectItem value="communication">
                                    Communication
                                </SelectItem>
                                <SelectItem value="weather">Weather</SelectItem>
                                <SelectItem value="navigation">
                                    Navigation
                                </SelectItem>
                                <SelectItem value="scientific">
                                    Scientific
                                </SelectItem>
                                <SelectItem value="earth-observation">
                                    Earth Observation
                                </SelectItem>
                                <SelectItem value="military">
                                    Military
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant={showSatellites ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                    setShowSatellites(!showSatellites)
                                }
                            >
                                {showSatellites ? (
                                    <Eye className="h-3 w-3 mr-1" />
                                ) : (
                                    <EyeOff className="h-3 w-3 mr-1" />
                                )}
                                Satellites
                            </Button>
                            <Button
                                variant={
                                    showLaunchSites ? "default" : "outline"
                                }
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                    setShowLaunchSites(!showLaunchSites)
                                }
                            >
                                <MapPin className="h-3 w-3 mr-1" />
                                Sites
                            </Button>
                            <Button
                                variant={showOrbits ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setShowOrbits(!showOrbits)}
                            >
                                Orbits
                            </Button>
                            <Button
                                variant={showArtemis ? "default" : "outline"}
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setShowArtemis(!showArtemis)}
                            >
                                <Rocket className="h-3 w-3 mr-1" />
                                Artemis
                            </Button>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-7 text-xs"
                            onClick={handleResetView}
                        >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Reset View
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {selectedSatellite && (
                <div className="absolute top-4 right-4 z-10">
                    <Card className="glass-effect w-64">
                        <CardHeader className="p-3">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-sm">
                                    {selectedSatellite.name}
                                </CardTitle>
                                <Badge
                                    variant="outline"
                                    className="text-xs capitalize"
                                >
                                    {selectedSatellite.category}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-3 pt-0 space-y-2">
                            <div className="text-xs space-y-1">
                                <p>
                                    <span className="text-muted-foreground">
                                        NORAD ID:
                                    </span>{" "}
                                    {selectedSatellite.noradId}
                                </p>
                                {positions.get(selectedSatellite.id) && (
                                    <>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Altitude:
                                            </span>{" "}
                                            {positions
                                                .get(selectedSatellite.id)!
                                                .altitude.toFixed(1)}{" "}
                                            km
                                        </p>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Velocity:
                                            </span>{" "}
                                            {positions
                                                .get(selectedSatellite.id)!
                                                .velocity.toFixed(2)}{" "}
                                            km/s
                                        </p>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Lat:
                                            </span>{" "}
                                            {positions
                                                .get(selectedSatellite.id)!
                                                .latitude.toFixed(4)}
                                            °
                                        </p>
                                        <p>
                                            <span className="text-muted-foreground">
                                                Lng:
                                            </span>{" "}
                                            {positions
                                                .get(selectedSatellite.id)!
                                                .longitude.toFixed(4)}
                                            °
                                        </p>
                                    </>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() =>
                                        handleFocusSatellite(selectedSatellite)
                                    }
                                >
                                    Focus
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 h-7 text-xs"
                                    onClick={() => setSelectedSatellite(null)}
                                >
                                    Close
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div
                ref={globeRef}
                className="globe-container w-full h-full min-h-[500px] md:min-h-[600px]"
            />

            <div className="absolute bottom-4 left-4 z-10">
                <Card className="glass-effect">
                    <CardContent className="p-2">
                        <div className="flex flex-wrap gap-2 text-xs">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                                <span>Launch Sites</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor:
                                            getCategoryColor("iss"),
                                    }}
                                />
                                <span>ISS</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor:
                                            getCategoryColor("starlink"),
                                    }}
                                />
                                <span>Starlink</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{
                                        backgroundColor:
                                            getCategoryColor("communication"),
                                    }}
                                />
                                <span>Comm</span>
                            </div>
                            {showArtemis && (
                                <>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor: "#f97316",
                                                boxShadow: "0 0 4px #f97316",
                                            }}
                                        />
                                        <span>🚀 Orion</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    PHASE_COLORS["earth-orbit"],
                                            }}
                                        />
                                        <span>Earth Orbit</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    PHASE_COLORS["translunar"],
                                            }}
                                        />
                                        <span>Translunar</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div
                                            className="w-3 h-3 rounded-full"
                                            style={{
                                                backgroundColor:
                                                    PHASE_COLORS["return"],
                                            }}
                                        />
                                        <span>Return</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
