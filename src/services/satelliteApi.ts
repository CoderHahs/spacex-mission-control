import type {
    Satellite,
    SatelliteCategory,
    SatellitePosition,
    TLE,
} from "@/types";
import { fetchWithCache } from "@/utils/cacheUtils";
import * as satellite from "satellite.js";

const CELESTRAK_BASE = "/api/celestrak/gp.php";

interface CelestrakTLE {
    OBJECT_NAME: string;
    OBJECT_ID: string;
    EPOCH: string;
    MEAN_MOTION: number;
    ECCENTRICITY: number;
    INCLINATION: number;
    RA_OF_ASC_NODE: number;
    ARG_OF_PERICENTER: number;
    MEAN_ANOMALY: number;
    EPHEMERIS_TYPE: number;
    CLASSIFICATION_TYPE: string;
    NORAD_CAT_ID: number;
    ELEMENT_SET_NO: number;
    REV_AT_EPOCH: number;
    BSTAR: number;
    MEAN_MOTION_DOT: number;
    MEAN_MOTION_DDOT: number;
    TLE_LINE0?: string;
    TLE_LINE1?: string;
    TLE_LINE2?: string;
}

/**
 * Compute satellite position directly from CelesTrak JSON orbital elements
 * using simplified Keplerian propagation. No TLE text needed.
 */
function positionFromElements(entry: CelestrakTLE): SatellitePosition | null {
    try {
        const DEG2RAD = Math.PI / 180;
        const EARTH_MU = 398600.4418; // km³/s²
        const EARTH_RADIUS = 6371; // km

        const n = entry.MEAN_MOTION; // rev/day
        if (!n || n <= 0) return null;

        // Semi-major axis from mean motion
        const nRadSec = (n * 2 * Math.PI) / 86400;
        const a = Math.pow(EARTH_MU / (nRadSec * nRadSec), 1 / 3);
        const altitude = a * (1 - entry.ECCENTRICITY) - EARTH_RADIUS;
        if (altitude < 0 || !isFinite(altitude)) return null;

        // Time since epoch
        const epochDate = new Date(entry.EPOCH);
        const now = new Date();
        const dtSec = (now.getTime() - epochDate.getTime()) / 1000;

        // Current mean anomaly
        const M =
            (entry.MEAN_ANOMALY * DEG2RAD + nRadSec * dtSec) % (2 * Math.PI);

        // Solve Kepler's equation: E - e*sin(E) = M (Newton's method)
        let E = M;
        const e = entry.ECCENTRICITY;
        for (let i = 0; i < 10; i++) {
            E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        }

        // True anomaly
        const sinV =
            (Math.sqrt(1 - e * e) * Math.sin(E)) / (1 - e * Math.cos(E));
        const cosV = (Math.cos(E) - e) / (1 - e * Math.cos(E));
        const v = Math.atan2(sinV, cosV);

        // Radius
        const r = a * (1 - e * Math.cos(E));

        // Position in orbital plane
        const argP = entry.ARG_OF_PERICENTER * DEG2RAD;
        const u = v + argP;
        const xOrb = r * Math.cos(u);
        const yOrb = r * Math.sin(u);

        // Transform to ECI
        const raan = entry.RA_OF_ASC_NODE * DEG2RAD;
        const inc = entry.INCLINATION * DEG2RAD;

        const xECI =
            xOrb * (Math.cos(raan) * 1 - Math.sin(raan) * Math.cos(inc) * 0) +
            yOrb * (-Math.sin(raan) * Math.cos(inc));
        const yECI =
            xOrb * (Math.sin(raan) * 1 + Math.cos(raan) * Math.cos(inc) * 0) +
            yOrb * (Math.cos(raan) * Math.cos(inc));
        const zECI = xOrb * 0 + yOrb * Math.sin(inc);

        // Correct ECI calculation
        const xE =
            xOrb * Math.cos(raan) - yOrb * Math.sin(raan) * Math.cos(inc);
        const yE =
            xOrb * Math.sin(raan) + yOrb * Math.cos(raan) * Math.cos(inc);
        const zE = yOrb * Math.sin(inc);

        // ECI to geodetic
        const gmst = getGMST(now);
        const longitude =
            ((((Math.atan2(yE, xE) - gmst) * 180) / Math.PI + 540) % 360) - 180;
        const latitude =
            (Math.atan2(zE, Math.sqrt(xE * xE + yE * yE)) * 180) / Math.PI;
        const alt = r - EARTH_RADIUS;

        if (!isFinite(latitude) || !isFinite(longitude) || !isFinite(alt))
            return null;

        // Orbital velocity (vis-viva)
        const velocity = Math.sqrt(EARTH_MU * (2 / r - 1 / a));

        return { latitude, longitude, altitude: alt, velocity };
    } catch {
        return null;
    }
}

/** Greenwich Mean Sidereal Time in radians */
function getGMST(date: Date): number {
    const JD = date.getTime() / 86400000 + 2440587.5;
    const T = (JD - 2451545.0) / 36525.0;
    let gmst =
        280.46061837 +
        360.98564736629 * (JD - 2451545.0) +
        0.000387933 * T * T -
        (T * T * T) / 38710000.0;
    gmst = ((gmst % 360) + 360) % 360;
    return gmst * (Math.PI / 180);
}

export async function fetchTLEData(group: string): Promise<CelestrakTLE[]> {
    const groupUpper = group.toUpperCase();
    const url = `${CELESTRAK_BASE}?GROUP=${groupUpper}&FORMAT=JSON`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(
            `Failed to fetch TLE data for group "${groupUpper}": ${response.status} ${response.statusText}`,
        );
    }
    const data = await response.json();

    // CelesTrak returns an empty array or an error string for invalid groups
    if (!Array.isArray(data)) {
        throw new Error(
            `Unexpected response for group "${groupUpper}": ${JSON.stringify(data).slice(0, 200)}`,
        );
    }
    return data;
}

export function calculateSatellitePosition(
    tle: TLE,
    date: Date = new Date(),
): SatellitePosition | null {
    try {
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        const positionAndVelocity = satellite.propagate(satrec, date);

        if (
            !positionAndVelocity.position ||
            typeof positionAndVelocity.position === "boolean"
        ) {
            return null;
        }

        const gmst = satellite.gstime(date);
        const position =
            positionAndVelocity.position as satellite.EciVec3<number>;
        const geodetic = satellite.eciToGeodetic(position, gmst);

        const latitude = satellite.degreesLat(geodetic.latitude);
        const longitude = satellite.degreesLong(geodetic.longitude);
        const altitude = geodetic.height;

        let velocity = 0;
        if (
            positionAndVelocity.velocity &&
            typeof positionAndVelocity.velocity !== "boolean"
        ) {
            const vel =
                positionAndVelocity.velocity as satellite.EciVec3<number>;
            velocity = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
        }

        return { latitude, longitude, altitude, velocity };
    } catch {
        return null;
    }
}

export function calculateOrbitPath(
    tle: TLE,
    startDate: Date = new Date(),
    numPoints: number = 100,
): { lat: number; lng: number; alt: number }[] {
    const points: { lat: number; lng: number; alt: number }[] = [];

    try {
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
        const period = (2 * Math.PI) / satrec.no; // Orbital period in minutes
        const stepMinutes = period / numPoints;

        for (let i = 0; i < numPoints; i++) {
            const time = new Date(
                startDate.getTime() + i * stepMinutes * 60 * 1000,
            );
            const positionAndVelocity = satellite.propagate(satrec, time);

            if (
                positionAndVelocity.position &&
                typeof positionAndVelocity.position !== "boolean"
            ) {
                const gmst = satellite.gstime(time);
                const position =
                    positionAndVelocity.position as satellite.EciVec3<number>;
                const geodetic = satellite.eciToGeodetic(position, gmst);

                points.push({
                    lat: satellite.degreesLat(geodetic.latitude),
                    lng: satellite.degreesLong(geodetic.longitude),
                    alt: geodetic.height / 6371, // Normalize to Earth radii for globe.gl
                });
            }
        }
    } catch {
        // Return empty array on error
    }

    return points;
}

export function categorizeByName(name: string): SatelliteCategory {
    const lowerName = name.toLowerCase();

    if (lowerName.includes("starlink")) return "starlink";
    if (lowerName.includes("iss") || lowerName.includes("zarya")) return "iss";
    if (
        lowerName.includes("gps") ||
        lowerName.includes("glonass") ||
        lowerName.includes("galileo")
    )
        return "navigation";
    if (
        lowerName.includes("goes") ||
        lowerName.includes("noaa") ||
        lowerName.includes("meteo")
    )
        return "weather";
    if (
        lowerName.includes("intelsat") ||
        lowerName.includes("ses") ||
        lowerName.includes("telesat")
    )
        return "communication";
    if (
        lowerName.includes("landsat") ||
        lowerName.includes("sentinel") ||
        lowerName.includes("worldview")
    )
        return "earth-observation";
    if (
        lowerName.includes("usa") ||
        lowerName.includes("nrol") ||
        lowerName.includes("cosmos")
    )
        return "military";
    if (
        lowerName.includes("hubble") ||
        lowerName.includes("webb") ||
        lowerName.includes("chandra")
    )
        return "scientific";

    return "other";
}

// Generate mock satellite data with direct positions for reliable rendering
export function getMockSatellites(): Satellite[] {
    const satellites: Satellite[] = [];
    const dummyTLE: TLE = { line1: "", line2: "" };

    // Seed-based pseudo-random for deterministic positions
    const seededRandom = (seed: number) => {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    };

    // Named satellites with realistic positions
    const named: Array<{
        name: string;
        noradId: number;
        category: SatelliteCategory;
        lat: number;
        lng: number;
        alt: number;
    }> = [
        {
            name: "ISS (ZARYA)",
            noradId: 25544,
            category: "iss",
            lat: 32.5,
            lng: -45.2,
            alt: 420,
        },
        {
            name: "HUBBLE",
            noradId: 20580,
            category: "scientific",
            lat: -12.3,
            lng: 78.1,
            alt: 540,
        },
        {
            name: "GPS BIIR-2",
            noradId: 24876,
            category: "navigation",
            lat: 42.1,
            lng: -120.5,
            alt: 20200,
        },
        {
            name: "GPS BIIR-3",
            noradId: 24877,
            category: "navigation",
            lat: -15.3,
            lng: 45.8,
            alt: 20200,
        },
        {
            name: "GPS BIIF-1",
            noradId: 36585,
            category: "navigation",
            lat: 55.2,
            lng: 160.3,
            alt: 20200,
        },
        {
            name: "NOAA 19",
            noradId: 33591,
            category: "weather",
            lat: 68.2,
            lng: -30.5,
            alt: 870,
        },
        {
            name: "GOES-16",
            noradId: 41866,
            category: "weather",
            lat: 0.1,
            lng: -75.2,
            alt: 35786,
        },
        {
            name: "GOES-18",
            noradId: 51850,
            category: "weather",
            lat: 0.0,
            lng: -137.2,
            alt: 35786,
        },
        {
            name: "INTELSAT 35E",
            noradId: 42818,
            category: "communication",
            lat: 0.0,
            lng: -34.5,
            alt: 35786,
        },
        {
            name: "INTELSAT 39",
            noradId: 44476,
            category: "communication",
            lat: 0.1,
            lng: 62.0,
            alt: 35786,
        },
        {
            name: "SES-17",
            noradId: 49055,
            category: "communication",
            lat: 0.0,
            lng: -67.1,
            alt: 35786,
        },
        {
            name: "LANDSAT 9",
            noradId: 49260,
            category: "earth-observation",
            lat: -22.5,
            lng: 135.2,
            alt: 705,
        },
        {
            name: "SENTINEL-2A",
            noradId: 40697,
            category: "earth-observation",
            lat: 45.3,
            lng: 10.5,
            alt: 786,
        },
        {
            name: "WORLDVIEW-3",
            noradId: 40115,
            category: "earth-observation",
            lat: 28.7,
            lng: -95.3,
            alt: 617,
        },
        {
            name: "COSMOS 2545",
            noradId: 46173,
            category: "military",
            lat: 64.8,
            lng: -170.2,
            alt: 850,
        },
        {
            name: "USA 326",
            noradId: 58113,
            category: "military",
            lat: 35.2,
            lng: -110.5,
            alt: 500,
        },
    ];

    for (const s of named) {
        satellites.push({
            id: `sat-${s.noradId}`,
            name: s.name,
            noradId: s.noradId,
            tle: dummyTLE,
            category: s.category,
            position: {
                latitude: s.lat,
                longitude: s.lng,
                altitude: s.alt,
                velocity: s.alt > 10000 ? 3.07 : 7.66,
            },
        });
    }

    // Generate Starlink constellation — 53° inclination shell (~600 satellites)
    for (let i = 0; i < 600; i++) {
        const seed = i + 1000;
        const lat = (seededRandom(seed) * 2 - 1) * 53;
        const lng = seededRandom(seed + 500) * 360 - 180;
        const alt = 540 + seededRandom(seed + 700) * 20;
        satellites.push({
            id: `sat-starlink-${i}`,
            name: `STARLINK-${1000 + i}`,
            noradId: 44713 + i,
            tle: dummyTLE,
            category: "starlink",
            position: {
                latitude: lat,
                longitude: lng,
                altitude: alt,
                velocity: 7.59,
            },
        });
    }

    // OneWeb-style — 87.9° inclination (~150 satellites)
    for (let i = 0; i < 150; i++) {
        const seed = i + 3000;
        const lat = (seededRandom(seed) * 2 - 1) * 87.9;
        const lng = seededRandom(seed + 500) * 360 - 180;
        satellites.push({
            id: `sat-oneweb-${i}`,
            name: `ONEWEB-${i}`,
            noradId: 56000 + i,
            tle: dummyTLE,
            category: "communication",
            position: {
                latitude: lat,
                longitude: lng,
                altitude: 1200,
                velocity: 7.32,
            },
        });
    }

    // Additional LEO satellites — various inclinations (~200 satellites)
    const leoCategories: SatelliteCategory[] = [
        "earth-observation",
        "scientific",
        "weather",
        "military",
        "other",
    ];
    for (let i = 0; i < 200; i++) {
        const seed = i + 5000;
        const inclination = 40 + seededRandom(seed + 100) * 58;
        const lat = (seededRandom(seed) * 2 - 1) * inclination;
        const lng = seededRandom(seed + 500) * 360 - 180;
        const alt = 400 + seededRandom(seed + 800) * 600;
        const cat =
            leoCategories[
                Math.floor(seededRandom(seed + 900) * leoCategories.length)
            ];
        satellites.push({
            id: `sat-leo-${i}`,
            name: `LEO-SAT-${i}`,
            noradId: 60000 + i,
            tle: dummyTLE,
            category: cat,
            position: {
                latitude: lat,
                longitude: lng,
                altitude: alt,
                velocity: 7.5,
            },
        });
    }

    // GPS constellation — 55° inclination, MEO (~30 satellites)
    for (let i = 0; i < 30; i++) {
        const seed = i + 7000;
        const lat = (seededRandom(seed) * 2 - 1) * 55;
        const lng = seededRandom(seed + 500) * 360 - 180;
        satellites.push({
            id: `sat-gps-${i}`,
            name: `GPS-${i}`,
            noradId: 70000 + i,
            tle: dummyTLE,
            category: "navigation",
            position: {
                latitude: lat,
                longitude: lng,
                altitude: 20200,
                velocity: 3.87,
            },
        });
    }

    // GEO belt — near 0° inclination (~40 satellites)
    for (let i = 0; i < 40; i++) {
        const lng = (i / 40) * 360 - 180;
        const lat = (seededRandom(i + 9000) - 0.5) * 2;
        satellites.push({
            id: `sat-geo-${i}`,
            name: `GEO-SAT-${i}`,
            noradId: 80000 + i,
            tle: dummyTLE,
            category: "communication",
            position: {
                latitude: lat,
                longitude: lng,
                altitude: 35786,
                velocity: 3.07,
            },
        });
    }

    return satellites;
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

export async function fetchTLEDataWithFallback(
    group: string,
): Promise<Satellite[]> {
    try {
        const cacheKey = `celestrak-json-${group}`;
        const dummyTLE: TLE = { line1: "", line2: "" };

        const jsonData = await fetchWithCache<CelestrakTLE[]>(
            cacheKey,
            () => fetchTLEData(group),
            TWO_HOURS_MS,
        );

        const sats: Satellite[] = jsonData
            .map((entry): Satellite | null => {
                // Compute position directly from orbital elements
                const position = positionFromElements(entry);
                if (!position) return null;

                return {
                    id: `sat-${entry.NORAD_CAT_ID}`,
                    name: entry.OBJECT_NAME,
                    noradId: entry.NORAD_CAT_ID,
                    tle: dummyTLE,
                    category: categorizeByName(entry.OBJECT_NAME),
                    position,
                };
            })
            .filter((sat): sat is Satellite => sat !== null);

        if (sats.length < 10) {
            console.warn(
                `[CelesTrak] Group "${group}" returned only ${sats.length} valid satellites, using mock data`,
            );
            return getMockSatellites();
        }
        console.info(
            `[CelesTrak] Loaded ${sats.length} satellites for group "${group}"`,
        );
        return sats;
    } catch (error) {
        console.warn(
            `[CelesTrak] Failed to fetch group "${group}", using mock data:`,
            error instanceof Error ? error.message : error,
        );
        return getMockSatellites();
    }
}

export function getMockLaunchSites(): {
    name: string;
    lat: number;
    lng: number;
    country: string;
    launches: number;
}[] {
    return [
        {
            name: "Kennedy Space Center",
            lat: 28.5721,
            lng: -80.648,
            country: "USA",
            launches: 185,
        },
        {
            name: "Cape Canaveral SFS",
            lat: 28.4889,
            lng: -80.5778,
            country: "USA",
            launches: 238,
        },
        {
            name: "Vandenberg SFB",
            lat: 34.742,
            lng: -120.5724,
            country: "USA",
            launches: 98,
        },
        {
            name: "Baikonur Cosmodrome",
            lat: 45.965,
            lng: 63.305,
            country: "Kazakhstan",
            launches: 1547,
        },
        {
            name: "Guiana Space Centre",
            lat: 5.2322,
            lng: -52.7693,
            country: "French Guiana",
            launches: 312,
        },
        {
            name: "Jiuquan Satellite Center",
            lat: 40.9583,
            lng: 100.2916,
            country: "China",
            launches: 195,
        },
        {
            name: "Xichang Satellite Center",
            lat: 28.2463,
            lng: 102.0268,
            country: "China",
            launches: 185,
        },
        {
            name: "Wenchang Space Launch",
            lat: 19.6145,
            lng: 110.9512,
            country: "China",
            launches: 25,
        },
        {
            name: "Satish Dhawan Space Centre",
            lat: 13.7199,
            lng: 80.2304,
            country: "India",
            launches: 89,
        },
        {
            name: "Tanegashima Space Center",
            lat: 30.401,
            lng: 130.975,
            country: "Japan",
            launches: 48,
        },
        {
            name: "Plesetsk Cosmodrome",
            lat: 62.9271,
            lng: 40.5777,
            country: "Russia",
            launches: 1618,
        },
        {
            name: "Rocket Lab LC-1",
            lat: -39.2619,
            lng: 177.8646,
            country: "New Zealand",
            launches: 45,
        },
        {
            name: "Vostochny Cosmodrome",
            lat: 51.8843,
            lng: 128.3335,
            country: "Russia",
            launches: 12,
        },
        {
            name: "Esrange Space Center",
            lat: 67.8934,
            lng: 21.1059,
            country: "Sweden",
            launches: 8,
        },
    ];
}
