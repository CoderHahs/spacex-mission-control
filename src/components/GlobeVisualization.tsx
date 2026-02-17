import { useEffect, useRef, useState, useCallback } from 'react';
import Globe from 'globe.gl';
import type { Satellite, SatelliteCategory } from '@/types';
import { 
  getMockSatellites, 
  getMockLaunchSites, 
  calculateOrbitPath,
  fetchMultipleSatelliteGroups,
  MINIMAL_SATELLITE_GROUPS
} from '@/services/satelliteApi';
import { useSatellitePositions } from '@/hooks/useSatellitePositions';
import { getCategoryColor } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Satellite as SatelliteIcon, MapPin, RefreshCw, Eye, EyeOff, Loader2, Globe2 } from 'lucide-react';

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
  category: SatelliteCategory;
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

// NASA texture URLs for realistic Earth rendering
const EARTH_TEXTURES = {
  dayMap: 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
  nightMap: 'https://unpkg.com/three-globe/example/img/earth-night.jpg',
  bumpMap: 'https://unpkg.com/three-globe/example/img/earth-topology.png',
  specularMap: 'https://unpkg.com/three-globe/example/img/earth-water.png',
};

export function GlobeVisualization({ className }: GlobeVisualizationProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<GlobeInstanceType>(null);
  const [satellites, setSatellites] = useState<Satellite[]>(getMockSatellites());
  const [launchSites] = useState(getMockLaunchSites());
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);
  const [showOrbits, setShowOrbits] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showLaunchSites, setShowLaunchSites] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ loaded: 0, total: 0 });
  const [useLiveData, setUseLiveData] = useState(false);

  const positions = useSatellitePositions(satellites);

  const filteredSatellites = satellites.filter(
    (sat) => categoryFilter === 'all' || sat.category === categoryFilter
  );

  // Fetch live satellite data from CelesTrak
  const loadLiveSatellites = useCallback(async () => {
    setIsLoading(true);
    setLoadingProgress({ loaded: 0, total: MINIMAL_SATELLITE_GROUPS.length });
    
    try {
      const liveSatellites = await fetchMultipleSatelliteGroups(
        MINIMAL_SATELLITE_GROUPS,
        (loaded, total) => setLoadingProgress({ loaded, total })
      );
      
      if (liveSatellites.length > 0) {
        setSatellites(liveSatellites);
        setUseLiveData(true);
      }
    } catch (error) {
      console.error('Failed to fetch live satellite data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initGlobe = useCallback(() => {
    if (!globeRef.current || globeInstanceRef.current) return;

    const globe = Globe()(globeRef.current)
      .globeImageUrl(EARTH_TEXTURES.dayMap)
      .bumpImageUrl(EARTH_TEXTURES.bumpMap)
      .backgroundImageUrl('//unpkg.com/three-globe/example/img/night-sky.png')
      .showAtmosphere(true)
      .atmosphereColor('#1a237e')
      .atmosphereAltitude(0.15)
      .pointOfView({ lat: 20, lng: -40, altitude: 2.2 });

    // Configure smooth camera controls
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.3;
    globe.controls().enableZoom = true;
    globe.controls().enablePan = true;
    globe.controls().minDistance = 120;
    globe.controls().maxDistance = 800;
    globe.controls().zoomSpeed = 0.8;
    globe.controls().rotateSpeed = 0.5;
    globe.controls().enableDamping = true;
    globe.controls().dampingFactor = 0.1;

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

    // Update satellites with glow effect styling
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
            alt: pos.altitude / 6371 + 0.005,
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
        .pointRadius(0.15)
        .pointResolution(8)
        .pointLabel((d: SatellitePointData) => 
          `<div style="background: rgba(10,10,30,0.95); backdrop-filter: blur(8px); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(100,150,255,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 4px;">${d.name}</div>
            <div style="font-size: 11px; color: rgba(200,220,255,0.8);">NORAD: ${d.noradId}</div>
            <div style="font-size: 11px; color: ${d.color}; text-transform: capitalize;">${d.category}</div>
            <div style="font-size: 11px; color: rgba(200,220,255,0.8);">Alt: ${d.altitude.toFixed(0)} km</div>
            <div style="font-size: 11px; color: rgba(200,220,255,0.8);">Vel: ${d.velocity.toFixed(2)} km/s</div>
          </div>`
        )
        .onPointClick((point: SatellitePointData) => {
          const sat = satellites.find((s) => s.id === point.id);
          if (sat) setSelectedSatellite(sat);
        });
    } else {
      globe.pointsData([]);
    }

    // Update launch sites with minimalist styling
    if (showLaunchSites) {
      const siteData: LaunchSiteData[] = launchSites.map((site) => ({
        ...site,
        size: Math.max(0.4, Math.log10(site.launches + 1) * 0.25),
      }));

      globe
        .labelsData(siteData)
        .labelLat('lat')
        .labelLng('lng')
        .labelText('name')
        .labelSize(0.4)
        .labelDotRadius(0.3)
        .labelColor(() => '#ff6b6b')
        .labelResolution(2)
        .labelLabel((d: LaunchSiteData) => 
          `<div style="background: rgba(10,10,30,0.95); backdrop-filter: blur(8px); padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(255,100,100,0.3); box-shadow: 0 4px 20px rgba(0,0,0,0.5);">
            <div style="font-weight: 600; font-size: 13px; color: #fff; margin-bottom: 4px;">${d.name}</div>
            <div style="font-size: 11px; color: rgba(200,220,255,0.8);">${d.country}</div>
            <div style="font-size: 11px; color: #ff6b6b;">Launches: ${d.launches}</div>
          </div>`
        );
    } else {
      globe.labelsData([]);
    }

    // Update orbit paths with animated trajectory traces
    if (showOrbits && selectedSatellite) {
      const orbitPath = calculateOrbitPath(selectedSatellite.tle);
      globe
        .pathsData([{ points: orbitPath }])
        .pathPoints('points')
        .pathPointLat((p: OrbitPointData) => p.lat)
        .pathPointLng((p: OrbitPointData) => p.lng)
        .pathPointAlt((p: OrbitPointData) => p.alt + 0.003)
        .pathColor(() => getCategoryColor(selectedSatellite.category))
        .pathStroke(1.5)
        .pathDashLength(0.15)
        .pathDashGap(0.008)
        .pathDashAnimateTime(8000)
        .pathTransitionDuration(500);
    } else {
      globe.pathsData([]);
    }
  }, [satellites, filteredSatellites, positions, launchSites, showSatellites, showLaunchSites, showOrbits, selectedSatellite]);

  const handleResetView = () => {
    globeInstanceRef.current?.pointOfView({ lat: 20, lng: -40, altitude: 2.2 }, 1500);
  };

  const handleFocusSatellite = (satellite: Satellite) => {
    const pos = positions.get(satellite.id);
    if (pos && globeInstanceRef.current) {
      globeInstanceRef.current.pointOfView(
        { lat: pos.latitude, lng: pos.longitude, altitude: 0.8 },
        1500
      );
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <Card className="glass-effect bg-slate-900/80 border-slate-700/50">
          <CardHeader className="p-3">
            <CardTitle className="text-sm flex items-center gap-2 text-slate-100">
              <Globe2 className="h-4 w-4" />
              Satellite Tracker
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {/* Live Data Toggle */}
            <Button
              variant={useLiveData ? 'default' : 'outline'}
              size="sm"
              className="w-full h-8 text-xs"
              onClick={loadLiveSatellites}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Loading {loadingProgress.loaded}/{loadingProgress.total}...
                </>
              ) : (
                <>
                  <SatelliteIcon className="h-3 w-3 mr-1" />
                  {useLiveData ? `Live Data (${satellites.length})` : 'Load Live Data'}
                </>
              )}
            </Button>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full h-8 text-xs bg-slate-800/50 border-slate-600/50">
                <SelectValue placeholder="Filter category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ({satellites.length})</SelectItem>
                <SelectItem value="iss">Space Stations</SelectItem>
                <SelectItem value="starlink">Starlink</SelectItem>
                <SelectItem value="communication">Communication</SelectItem>
                <SelectItem value="weather">Weather</SelectItem>
                <SelectItem value="navigation">Navigation</SelectItem>
                <SelectItem value="scientific">Scientific</SelectItem>
                <SelectItem value="earth-observation">Earth Observation</SelectItem>
                <SelectItem value="military">Military</SelectItem>
                <SelectItem value="other">Other</SelectItem>
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
                Sats
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
          <Card className="glass-effect bg-slate-900/80 border-slate-700/50 w-64">
            <CardHeader className="p-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm text-slate-100">{selectedSatellite.name}</CardTitle>
                <Badge 
                  variant="outline" 
                  className="text-xs capitalize"
                  style={{ borderColor: getCategoryColor(selectedSatellite.category), color: getCategoryColor(selectedSatellite.category) }}
                >
                  {selectedSatellite.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
              <div className="text-xs space-y-1 text-slate-300">
                <p><span className="text-slate-500">NORAD ID:</span> {selectedSatellite.noradId}</p>
                {positions.get(selectedSatellite.id) && (
                  <>
                    <p><span className="text-slate-500">Altitude:</span> {positions.get(selectedSatellite.id)!.altitude.toFixed(1)} km</p>
                    <p><span className="text-slate-500">Velocity:</span> {positions.get(selectedSatellite.id)!.velocity.toFixed(2)} km/s</p>
                    <p><span className="text-slate-500">Lat:</span> {positions.get(selectedSatellite.id)!.latitude.toFixed(4)}°</p>
                    <p><span className="text-slate-500">Lng:</span> {positions.get(selectedSatellite.id)!.longitude.toFixed(4)}°</p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs border-slate-600"
                  onClick={() => handleFocusSatellite(selectedSatellite)}
                >
                  Focus
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 h-7 text-xs border-slate-600"
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
        <Card className="glass-effect bg-slate-900/80 border-slate-700/50">
          <CardContent className="p-2">
            <div className="flex flex-wrap gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]" />
                <span>Sites</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor('iss') }} />
                <span>Stations</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor('starlink') }} />
                <span>Starlink</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor('navigation') }} />
                <span>Nav</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor('weather') }} />
                <span>Weather</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: getCategoryColor('communication') }} />
                <span>Comm</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Satellite count indicator */}
      <div className="absolute bottom-4 right-4 z-10">
        <Badge variant="outline" className="bg-slate-900/80 border-slate-700/50 text-slate-300 text-xs">
          {filteredSatellites.length} satellites tracked
        </Badge>
      </div>
    </div>
  );
}
