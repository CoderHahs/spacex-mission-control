import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import type { Satellite } from '@/types';
import { getMockSatellites, getMockLaunchSites, calculateOrbitPath } from '@/services/satelliteApi';
import { useSatellitePositions } from '@/hooks/useSatellitePositions';
import { getCategoryColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Satellite as SatelliteIcon, MapPin, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface GlobeVisualizationProps {
  className?: string;
}

// Define types for globe data
interface SatellitePointData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  alt: number;
  color: string;
  category: string;
  noradId: number;
  velocity: number;
  altitude: number;
}

interface LaunchSiteData {
  name: string;
  lat: number;
  lng: number;
  country: string;
  launches: number;
  size: number;
}

interface OrbitPointData {
  lat: number;
  lng: number;
  alt: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeInstanceType = any;

export function GlobeVisualization({ className }: GlobeVisualizationProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<GlobeInstanceType>(null);
  const [satellites] = useState<Satellite[]>(getMockSatellites());
  const [launchSites] = useState(getMockLaunchSites());
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showLaunchSites, setShowLaunchSites] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const positions = useSatellitePositions(satellites);

  const filteredSatellites = satellites.filter(
    (sat) => categoryFilter === 'all' || sat.category === categoryFilter
  );

  const initGlobe = useCallback(() => {
    if (!globeRef.current || globeInstanceRef.current) return;

    const globe = Globe()(globeRef.current)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-blue-marble.jpg')
      .bumpImageUrl('//unpkg.com/three-globe/example/img/earth-topology.png')
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#3a228a')
      .atmosphereAltitude(0.25)
      .pointOfView({ lat: 30, lng: -30, altitude: 2.5 });

    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.5;
    globe.controls().enableZoom = true;
    globe.controls().enablePan = true;

    globeInstanceRef.current = globe;
  }, []);

  useEffect(() => {
    initGlobe();

    return () => {
      if (globeInstanceRef.current) {
        globeInstanceRef.current._destructor?.();
      }
    };
  }, [initGlobe]);

  useEffect(() => {
    if (!globeInstanceRef.current) return;

    const globe = globeInstanceRef.current;

    // Update satellites
    if (showSatellites) {
      const satData: SatellitePointData[] = filteredSatellites
        .map((sat) => {
          const pos = positions.get(sat.id);
          if (!pos) return null;
          return {
            id: sat.id,
            name: sat.name,
            lat: pos.latitude,
            lng: pos.longitude,
            alt: pos.altitude / 6371 + 0.01,
            color: getCategoryColor(sat.category),
            category: sat.category,
            noradId: sat.noradId,
            velocity: pos.velocity,
            altitude: pos.altitude,
          };
        })
        .filter((item): item is SatellitePointData => item !== null);

      globe
        .pointsData(satData)
        .pointLat('lat')
        .pointLng('lng')
        .pointAltitude('alt')
        .pointColor('color')
        .pointRadius(0.3)
        .pointLabel((d: SatellitePointData) => 
          `<div class="bg-background/90 backdrop-blur-sm p-2 rounded-lg border shadow-lg">
            <div class="font-bold text-sm">${d.name}</div>
            <div class="text-xs text-muted-foreground">NORAD: ${d.noradId}</div>
            <div class="text-xs text-muted-foreground">Category: ${d.category}</div>
            <div class="text-xs text-muted-foreground">Alt: ${d.altitude.toFixed(0)} km</div>
            <div class="text-xs text-muted-foreground">Vel: ${d.velocity.toFixed(2)} km/s</div>
          </div>`
        )
        .onPointClick((point: SatellitePointData) => {
          const sat = satellites.find((s) => s.id === point.id);
          if (sat) setSelectedSatellite(sat);
        });
    } else {
      globe.pointsData([]);
    }

    // Update launch sites
    if (showLaunchSites) {
      const siteData: LaunchSiteData[] = launchSites.map((site) => ({
        ...site,
        size: Math.max(0.5, Math.log10(site.launches + 1) * 0.3),
      }));

      globe
        .labelsData(siteData)
        .labelLat('lat')
        .labelLng('lng')
        .labelText('name')
        .labelSize(0.5)
        .labelDotRadius(0.4)
        .labelColor(() => '#ef4444')
        .labelResolution(2)
        .labelLabel((d: LaunchSiteData) => 
          `<div class="bg-background/90 backdrop-blur-sm p-2 rounded-lg border shadow-lg">
            <div class="font-bold text-sm">${d.name}</div>
            <div class="text-xs text-muted-foreground">${d.country}</div>
            <div class="text-xs text-muted-foreground">Total Launches: ${d.launches}</div>
          </div>`
        );
    } else {
      globe.labelsData([]);
    }

    // Update orbit paths
    if (showOrbits && selectedSatellite) {
      const orbitPath = calculateOrbitPath(selectedSatellite.tle);
      globe
        .pathsData([{ points: orbitPath }])
        .pathPoints('points')
        .pathPointLat((p: OrbitPointData) => p.lat)
        .pathPointLng((p: OrbitPointData) => p.lng)
        .pathPointAlt((p: OrbitPointData) => p.alt + 0.01)
        .pathColor(() => getCategoryColor(selectedSatellite.category))
        .pathStroke(2)
        .pathDashLength(0.1)
        .pathDashGap(0.02)
        .pathDashAnimateTime(5000);
    } else {
      globe.pathsData([]);
    }
  }, [satellites, filteredSatellites, positions, launchSites, showSatellites, showLaunchSites, showOrbits, selectedSatellite]);

  const handleResetView = () => {
    globeInstanceRef.current?.pointOfView({ lat: 30, lng: -30, altitude: 2.5 }, 1000);
  };

  const handleFocusSatellite = (satellite: Satellite) => {
    const pos = positions.get(satellite.id);
    if (pos && globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView(
        { lat: pos.latitude, lng: pos.longitude, altitude: 0.5 },
        1000
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
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="iss">ISS</SelectItem>
                <SelectItem value="starlink">Starlink</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="scientific">Scientific</SelectItem>
                <SelectItem value="earth-observation">Earth Observation</SelectItem>
                <SelectItem value="military">Military</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={showSatellites ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowSatellites(!showSatellites)}
              >
                {showSatellites ? <Eye className="h-3 w-3 mr-1" /> : <EyeOff className="h-3 w-3 mr-1" />}
                Satellites
              </Button>
              <Button
                variant={showLaunchSites ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowLaunchSites(!showLaunchSites)}
              >
                <MapPin className="h-3 w-3 mr-1" />
                Sites
              </Button>
              <Button
                variant={showOrbits ? 'default' : 'outline'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowOrbits(!showOrbits)}
              >
                Orbits
              </Button>
            </div>

            <Button variant="outline" size="sm" className="w-full h-7 text-xs" onClick={handleResetView}>
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
                <CardTitle className="text-sm">{selectedSatellite.name}</CardTitle>
                <Badge variant="outline" className="text-xs capitalize">
                  {selectedSatellite.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="text-xs space-y-1">
                <p><span className="text-muted-foreground">NORAD ID:</span> {selectedSatellite.noradId}</p>
                {positions.get(selectedSatellite.id) && (
                  <>
                    <p><span className="text-muted-foreground">Altitude:</span> {positions.get(selectedSatellite.id)!.altitude.toFixed(1)} km</p>
                    <p><span className="text-muted-foreground">Velocity:</span> {positions.get(selectedSatellite.id)!.velocity.toFixed(2)} km/s</p>
                    <p><span className="text-muted-foreground">Lat:</span> {positions.get(selectedSatellite.id)!.latitude.toFixed(4)}°</p>
                    <p><span className="text-muted-foreground">Lng:</span> {positions.get(selectedSatellite.id)!.longitude.toFixed(4)}°</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs"
                  onClick={() => handleFocusSatellite(selectedSatellite)}
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

      <div ref={globeRef} className="globe-container w-full h-full min-h-[500px] md:min-h-[600px]" />

      <div className="absolute bottom-4 left-4 z-10">
        <Card className="glass-effect">
          <CardContent className="p-2">
            <div className="flex flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span>Launch Sites</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('iss') }} />
                <span>ISS</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('starlink') }} />
                <span>Starlink</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor('communication') }} />
                <span>Comm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
