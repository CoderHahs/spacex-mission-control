import * as satellite from 'satellite.js';
import type { Satellite, SatelliteCategory, SatellitePosition, TLE } from '@/types';

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

// Satellite groups available from CelesTrak
export const SATELLITE_GROUPS = {
  stations: { name: 'Space Stations', category: 'iss' as SatelliteCategory },
  starlink: { name: 'Starlink', category: 'starlink' as SatelliteCategory },
  'active': { name: 'Active Satellites', category: 'other' as SatelliteCategory },
  weather: { name: 'Weather', category: 'weather' as SatelliteCategory },
  amateur: { name: 'Amateur Radio', category: 'communication' as SatelliteCategory },
  'geo': { name: 'Geostationary', category: 'communication' as SatelliteCategory },
  'gps-ops': { name: 'GPS Operational', category: 'navigation' as SatelliteCategory },
  'glo-ops': { name: 'GLONASS Operational', category: 'navigation' as SatelliteCategory },
  galileo: { name: 'Galileo', category: 'navigation' as SatelliteCategory },
  beidou: { name: 'Beidou', category: 'navigation' as SatelliteCategory },
  'resource': { name: 'Earth Resources', category: 'earth-observation' as SatelliteCategory },
  'science': { name: 'Science', category: 'scientific' as SatelliteCategory },
  'tle-new': { name: 'Last 30 Days Launches', category: 'other' as SatelliteCategory },
  'visual': { name: 'Brightest', category: 'other' as SatelliteCategory },
  oneweb: { name: 'OneWeb', category: 'communication' as SatelliteCategory },
  'planet': { name: 'Planet', category: 'earth-observation' as SatelliteCategory },
  'spire': { name: 'Spire', category: 'earth-observation' as SatelliteCategory },
  'iridium-NEXT': { name: 'Iridium NEXT', category: 'communication' as SatelliteCategory },
} as const;

export type SatelliteGroupKey = keyof typeof SATELLITE_GROUPS;

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

// Cache for TLE data to reduce API calls
const tleCache = new Map<string, { data: CelestrakTLE[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

export async function fetchTLEData(group: string): Promise<CelestrakTLE[]> {
  // Check cache first
  const cached = tleCache.get(group);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const response = await fetch(`${CELESTRAK_BASE}?GROUP=${group}&FORMAT=JSON`);
    if (!response.ok) {
      throw new Error(`Failed to fetch TLE data: ${response.statusText}`);
    }
    const data = await response.json();
    
    // Cache the result
    tleCache.set(group, { data, timestamp: Date.now() });
    
    return data;
  } catch (error) {
    // Return cached data if available, even if expired
    if (cached) {
      return cached.data;
    }
    throw error;
  }
}

// Fetch multiple satellite groups
export async function fetchMultipleSatelliteGroups(
  groups: SatelliteGroupKey[],
  onProgress?: (loaded: number, total: number) => void
): Promise<Satellite[]> {
  const allSatellites: Satellite[] = [];
  const seenNoradIds = new Set<number>();
  
  let loadedCount = 0;
  
  for (const group of groups) {
    try {
      const tleData = await fetchTLEData(group);
      const groupInfo = SATELLITE_GROUPS[group];
      
      for (const tle of tleData) {
        // Skip duplicates
        if (seenNoradIds.has(tle.NORAD_CAT_ID)) continue;
        seenNoradIds.add(tle.NORAD_CAT_ID);
        
        // Create TLE lines from JSON data if not provided
        const line1 = tle.TLE_LINE1 || generateTLELine1(tle);
        const line2 = tle.TLE_LINE2 || generateTLELine2(tle);
        
        if (!line1 || !line2) continue;
        
        const category = categorizeByName(tle.OBJECT_NAME, groupInfo.category);
        
        allSatellites.push({
          id: `sat-${tle.NORAD_CAT_ID}`,
          name: tle.OBJECT_NAME,
          noradId: tle.NORAD_CAT_ID,
          category,
          tle: { line1, line2 },
        });
      }
      
      loadedCount++;
      onProgress?.(loadedCount, groups.length);
    } catch (error) {
      console.warn(`Failed to fetch group ${group}:`, error);
      loadedCount++;
      onProgress?.(loadedCount, groups.length);
    }
  }
  
  return allSatellites;
}

// Generate TLE Line 1 from CelesTrak JSON format
function generateTLELine1(tle: CelestrakTLE): string | null {
  try {
    const norad = String(tle.NORAD_CAT_ID).padStart(5, '0');
    const classType = tle.CLASSIFICATION_TYPE || 'U';
    const intlDesig = (tle.OBJECT_ID || '').padEnd(8, ' ').slice(0, 8);
    const epoch = formatEpochForTLE(tle.EPOCH);
    const meanMotionDot = formatExponential(tle.MEAN_MOTION_DOT, 10);
    const meanMotionDDot = formatExponential(tle.MEAN_MOTION_DDOT, 8);
    const bstar = formatExponential(tle.BSTAR, 8);
    const ephemType = tle.EPHEMERIS_TYPE || 0;
    const elementSetNo = String(tle.ELEMENT_SET_NO || 999).padStart(4, ' ');
    
    const line = `1 ${norad}${classType} ${intlDesig} ${epoch} ${meanMotionDot} ${meanMotionDDot} ${bstar} ${ephemType} ${elementSetNo}`;
    
    // Add checksum
    const checksum = calculateChecksum(line);
    return line + checksum;
  } catch {
    return null;
  }
}

// Generate TLE Line 2 from CelesTrak JSON format
function generateTLELine2(tle: CelestrakTLE): string | null {
  try {
    const norad = String(tle.NORAD_CAT_ID).padStart(5, '0');
    const inclination = tle.INCLINATION.toFixed(4).padStart(8, ' ');
    const raan = tle.RA_OF_ASC_NODE.toFixed(4).padStart(8, ' ');
    const eccentricity = tle.ECCENTRICITY.toFixed(7).slice(2); // Remove "0."
    const argPeri = tle.ARG_OF_PERICENTER.toFixed(4).padStart(8, ' ');
    const meanAnomaly = tle.MEAN_ANOMALY.toFixed(4).padStart(8, ' ');
    const meanMotion = tle.MEAN_MOTION.toFixed(8).padStart(11, ' ');
    const revNum = String(tle.REV_AT_EPOCH || 0).padStart(5, ' ');
    
    const line = `2 ${norad} ${inclination} ${raan} ${eccentricity} ${argPeri} ${meanAnomaly} ${meanMotion}${revNum}`;
    
    const checksum = calculateChecksum(line);
    return line + checksum;
  } catch {
    return null;
  }
}

function formatEpochForTLE(epochStr: string): string {
  const date = new Date(epochStr);
  const year = date.getUTCFullYear() % 100;
  const startOfYear = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const dayOfYear = (date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000) + 1;
  return `${String(year).padStart(2, '0')}${dayOfYear.toFixed(8).padStart(12, '0')}`;
}

function formatExponential(value: number, width: number): string {
  if (Math.abs(value) < 1e-10) return ' 00000-0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const mantissa = value / Math.pow(10, exp);
  const mantissaStr = (mantissa * 100000).toFixed(0);
  const sign = exp >= 0 ? '+' : '-';
  return ` ${mantissaStr}${sign}${Math.abs(exp)}`;
}

function calculateChecksum(line: string): number {
  let checksum = 0;
  for (const char of line) {
    if (char >= '0' && char <= '9') {
      checksum += parseInt(char, 10);
    } else if (char === '-') {
      checksum += 1;
    }
  }
  return checksum % 10;
}

export function calculateSatellitePosition(tle: TLE, date: Date = new Date()): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }

    const gmst = satellite.gstime(date);
    const position = positionAndVelocity.position as satellite.EciVec3<number>;
    const geodetic = satellite.eciToGeodetic(position, gmst);

    const latitude = satellite.degreesLat(geodetic.latitude);
    const longitude = satellite.degreesLong(geodetic.longitude);
    const altitude = geodetic.height;

    let velocity = 0;
    if (positionAndVelocity.velocity && typeof positionAndVelocity.velocity !== 'boolean') {
      const vel = positionAndVelocity.velocity as satellite.EciVec3<number>;
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
  numPoints: number = 100
): { lat: number; lng: number; alt: number }[] {
  const points: { lat: number; lng: number; alt: number }[] = [];
  
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const period = (2 * Math.PI) / satrec.no; // Orbital period in minutes
    const stepMinutes = period / numPoints;

    for (let i = 0; i < numPoints; i++) {
      const time = new Date(startDate.getTime() + i * stepMinutes * 60 * 1000);
      const positionAndVelocity = satellite.propagate(satrec, time);

      if (positionAndVelocity.position && typeof positionAndVelocity.position !== 'boolean') {
        const gmst = satellite.gstime(time);
        const position = positionAndVelocity.position as satellite.EciVec3<number>;
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

export function categorizeByName(name: string, defaultCategory: SatelliteCategory = 'other'): SatelliteCategory {
  const lowerName = name.toLowerCase();
  
  // Most specific matches first
  if (lowerName.includes('starlink')) return 'starlink';
  if (lowerName.includes('iss') || lowerName.includes('zarya') || lowerName.includes('tiangong') || lowerName.includes('css')) return 'iss';
  
  // Navigation
  if (lowerName.includes('gps') || lowerName.includes('glonass') || lowerName.includes('galileo') || 
      lowerName.includes('beidou') || lowerName.includes('navstar')) return 'navigation';
  
  // Weather
  if (lowerName.includes('goes') || lowerName.includes('noaa') || lowerName.includes('meteo') ||
      lowerName.includes('metop') || lowerName.includes('himawari') || lowerName.includes('fengyun')) return 'weather';
  
  // Communication
  if (lowerName.includes('intelsat') || lowerName.includes('ses') || lowerName.includes('telesat') ||
      lowerName.includes('oneweb') || lowerName.includes('iridium') || lowerName.includes('globalstar') ||
      lowerName.includes('orbcomm') || lowerName.includes('o3b') || lowerName.includes('viasat')) return 'communication';
  
  // Earth observation
  if (lowerName.includes('landsat') || lowerName.includes('sentinel') || lowerName.includes('worldview') ||
      lowerName.includes('planet') || lowerName.includes('dove') || lowerName.includes('skysat') ||
      lowerName.includes('maxar') || lowerName.includes('spire') || lowerName.includes('icesat')) return 'earth-observation';
  
  // Military
  if (lowerName.includes('usa-') || lowerName.includes('nrol') || lowerName.includes('cosmos') ||
      lowerName.includes('yaogan') || lowerName.includes('lemur')) return 'military';
  
  // Scientific
  if (lowerName.includes('hubble') || lowerName.includes('webb') || lowerName.includes('chandra') ||
      lowerName.includes('fermi') || lowerName.includes('swift') || lowerName.includes('tess') ||
      lowerName.includes('kepler') || lowerName.includes('gaia') || lowerName.includes('xmm')) return 'scientific';
  
  return defaultCategory;
}

// Batch calculate positions for many satellites (optimized)
export function batchCalculatePositions(
  satellites: Satellite[],
  date: Date = new Date()
): Map<string, SatellitePosition> {
  const positions = new Map<string, SatellitePosition>();
  
  for (const sat of satellites) {
    const position = calculateSatellitePosition(sat.tle, date);
    if (position) {
      positions.set(sat.id, position);
    }
  }
  
  return positions;
}

// Calculate multiple orbit paths efficiently
export function calculateMultipleOrbitPaths(
  satellites: Satellite[],
  startDate: Date = new Date(),
  numPoints: number = 60
): Map<string, { lat: number; lng: number; alt: number }[]> {
  const paths = new Map<string, { lat: number; lng: number; alt: number }[]>();
  
  for (const sat of satellites) {
    const path = calculateOrbitPath(sat.tle, startDate, numPoints);
    if (path.length > 0) {
      paths.set(sat.id, path);
    }
  }
  
  return paths;
}

// Default satellite groups to load for a comprehensive view
export const DEFAULT_SATELLITE_GROUPS: SatelliteGroupKey[] = [
  'stations',
  'starlink',
  'weather',
  'gps-ops',
  'glo-ops',
  'galileo',
  'resource',
  'science',
  'geo',
  'iridium-NEXT',
  'visual',
];

// Minimal satellite groups for faster initial load
export const MINIMAL_SATELLITE_GROUPS: SatelliteGroupKey[] = [
  'stations',
  'visual',
  'weather',
  'gps-ops',
];

// Mock satellite data for development/fallback (expanded list)
export function getMockSatellites(): Satellite[] {
  const mockData: Array<{
    name: string;
    noradId: number;
    category: SatelliteCategory;
    line1: string;
    line2: string;
  }> = [
    // Space Stations
    {
      name: 'ISS (ZARYA)',
      noradId: 25544,
      category: 'iss',
      line1: '1 25544U 98067A   24045.54791667  .00016717  00000+0  30268-3 0  9993',
      line2: '2 25544  51.6416 205.3855 0004817 101.3267  16.4682 15.49924265438991',
    },
    {
      name: 'CSS (TIANHE)',
      noradId: 48274,
      category: 'iss',
      line1: '1 48274U 21035A   24045.50000000  .00005432  00000+0  61234-4 0  9991',
      line2: '2 48274  41.4740 123.4567 0006789  78.9012 281.2345 15.62345678123456',
    },
    // Starlink satellites
    {
      name: 'STARLINK-1007',
      noradId: 44713,
      category: 'starlink',
      line1: '1 44713U 19074A   24045.50000000  .00001543  00000+0  10853-3 0  9992',
      line2: '2 44713  53.0544 162.4321 0001541  75.5432 284.5789 15.06386912233456',
    },
    {
      name: 'STARLINK-1008',
      noradId: 44714,
      category: 'starlink',
      line1: '1 44714U 19074B   24045.50000000  .00001432  00000+0  10023-3 0  9991',
      line2: '2 44714  53.0532 165.2145 0001123  80.3214 279.7892 15.06423541233567',
    },
    {
      name: 'STARLINK-1009',
      noradId: 44715,
      category: 'starlink',
      line1: '1 44715U 19074C   24045.50000000  .00001521  00000+0  10612-3 0  9990',
      line2: '2 44715  53.0519 168.5234 0001789  85.2341 274.8123 15.06401234233678',
    },
    {
      name: 'STARLINK-2345',
      noradId: 47123,
      category: 'starlink',
      line1: '1 47123U 20088A   24045.50000000  .00001234  00000+0  98765-4 0  9993',
      line2: '2 47123  53.0512 171.2345 0001234  90.1234 269.8765 15.06456789123456',
    },
    {
      name: 'STARLINK-3456',
      noradId: 50234,
      category: 'starlink',
      line1: '1 50234U 21098A   24045.50000000  .00001345  00000+0  10234-3 0  9994',
      line2: '2 50234  53.0534 174.5678 0001567  95.6789 264.3210 15.06389012123456',
    },
    // Scientific satellites
    {
      name: 'HUBBLE SPACE TELESCOPE',
      noradId: 20580,
      category: 'scientific',
      line1: '1 20580U 90037B   24045.51111111  .00002543  00000+0  12543-3 0  9995',
      line2: '2 20580  28.4691 238.5432 0002834 226.5432 133.4321 15.09123456123456',
    },
    {
      name: 'JAMES WEBB SPACE TELESCOPE',
      noradId: 50463,
      category: 'scientific',
      line1: '1 50463U 21130A   24045.51234567  .00000012  00000+0  00000+0 0  9996',
      line2: '2 50463   0.0523 234.5678 0001234 123.4567 236.7890  0.01720000012345',
    },
    {
      name: 'TESS',
      noradId: 43435,
      category: 'scientific',
      line1: '1 43435U 18038A   24045.52345678  .00000123  00000+0  12345-4 0  9997',
      line2: '2 43435  28.5123 123.4567 0098765 234.5678 123.4567 13.85123456123456',
    },
    // Navigation satellites
    {
      name: 'GPS BIIR-2 (PRN 13)',
      noradId: 24876,
      category: 'navigation',
      line1: '1 24876U 97035A   24045.52222222  .00000043  00000+0  10000-3 0  9997',
      line2: '2 24876  55.4532  62.5432 0053234 236.5432 123.4321  2.00565234123456',
    },
    {
      name: 'GPS BIIF-3 (PRN 24)',
      noradId: 38833,
      category: 'navigation',
      line1: '1 38833U 12053A   24045.52345678  .00000034  00000+0  10000-3 0  9998',
      line2: '2 38833  54.8765 145.6789 0087654 198.7654 161.2345  2.00562345123456',
    },
    {
      name: 'GLONASS-M 735',
      noradId: 40315,
      category: 'navigation',
      line1: '1 40315U 14075A   24045.52456789  .00000056  00000+0  10000-3 0  9999',
      line2: '2 40315  64.8234 234.5678 0012345 256.7890 103.2109  2.13109876123456',
    },
    {
      name: 'GALILEO-FM21',
      noradId: 48859,
      category: 'navigation',
      line1: '1 48859U 21044A   24045.52567890  .00000045  00000+0  10000-3 0  9990',
      line2: '2 48859  56.1234 178.9012 0001234 234.5678 125.4321  1.70234567123456',
    },
    // Weather satellites
    {
      name: 'NOAA 19',
      noradId: 33591,
      category: 'weather',
      line1: '1 33591U 09005A   24045.53333333  .00000123  00000+0  98765-4 0  9996',
      line2: '2 33591  99.1234  87.5432 0014567  88.5432 271.6789 14.12345678123456',
    },
    {
      name: 'GOES-16',
      noradId: 41866,
      category: 'weather',
      line1: '1 41866U 16071A   24045.53456789  .00000012  00000+0  00000+0 0  9991',
      line2: '2 41866   0.0456 267.8901 0001234 178.9012 181.0987  1.00270234123456',
    },
    {
      name: 'GOES-18',
      noradId: 51850,
      category: 'weather',
      line1: '1 51850U 22021A   24045.53567890  .00000011  00000+0  00000+0 0  9992',
      line2: '2 51850   0.0234 278.9012 0001567 189.0123 170.9876  1.00271234123456',
    },
    {
      name: 'METOP-C',
      noradId: 43689,
      category: 'weather',
      line1: '1 43689U 18087A   24045.53678901  .00000134  00000+0  98654-4 0  9993',
      line2: '2 43689  98.7123  98.7654 0015678  99.8765 260.2345 14.21234567123456',
    },
    // Communication satellites
    {
      name: 'INTELSAT 35E',
      noradId: 42818,
      category: 'communication',
      line1: '1 42818U 17041A   24045.54444444  .00000013  00000+0  00000+0 0  9994',
      line2: '2 42818   0.0234  89.5432 0003234 273.5432 163.4321  1.00270145123456',
    },
    {
      name: 'IRIDIUM 163',
      noradId: 43479,
      category: 'communication',
      line1: '1 43479U 18047A   24045.54555555  .00000234  00000+0  23456-4 0  9995',
      line2: '2 43479  86.3934 234.5678 0001234 267.8901  92.1098 14.34567890123456',
    },
    {
      name: 'ONEWEB-0012',
      noradId: 44946,
      category: 'communication',
      line1: '1 44946U 20008A   24045.54666666  .00000345  00000+0  34567-4 0  9996',
      line2: '2 44946  87.8934 345.6789 0001567 278.9012  81.0987 13.15678901123456',
    },
    {
      name: 'SES-17',
      noradId: 49055,
      category: 'communication',
      line1: '1 49055U 21081A   24045.54777777  .00000014  00000+0  00000+0 0  9997',
      line2: '2 49055   0.0345 256.7890 0002345 289.0123 70.9876  1.00270456123456',
    },
    // Earth Observation satellites
    {
      name: 'LANDSAT 9',
      noradId: 49260,
      category: 'earth-observation',
      line1: '1 49260U 21088A   24045.55555555  .00000234  00000+0  23456-4 0  9998',
      line2: '2 49260  98.2234 141.5432 0001234  96.5432 263.5789 14.57234567123456',
    },
    {
      name: 'SENTINEL-2A',
      noradId: 40697,
      category: 'earth-observation',
      line1: '1 40697U 15028A   24045.55666666  .00000345  00000+0  34567-4 0  9999',
      line2: '2 40697  98.5678 152.6543 0001567 107.6543 252.4567 14.30789012123456',
    },
    {
      name: 'WORLDVIEW-3',
      noradId: 40115,
      category: 'earth-observation',
      line1: '1 40115U 14048A   24045.55777777  .00000456  00000+0  45678-4 0  9990',
      line2: '2 40115  97.8765 163.7654 0001678 118.7654 241.3456 15.17890123123456',
    },
    {
      name: 'PLANET SKYSAT-C1',
      noradId: 41773,
      category: 'earth-observation',
      line1: '1 41773U 16059A   24045.55888888  .00000567  00000+0  56789-4 0  9991',
      line2: '2 41773  97.4567 174.8765 0001789 129.8765 230.2345 15.08901234123456',
    },
    // Military satellites
    {
      name: 'COSMOS 2545',
      noradId: 46173,
      category: 'military',
      line1: '1 46173U 20052A   24045.56666666  .00000345  00000+0  34567-4 0  9999',
      line2: '2 46173  64.8234 234.5432 0012345 198.5432 161.4321 14.23456789123456',
    },
    {
      name: 'USA-326',
      noradId: 52000,
      category: 'military',
      line1: '1 52000U 22013A   24045.56777777  .00000456  00000+0  45678-4 0  9990',
      line2: '2 52000  63.4567 185.6543 0056789 209.6543 150.3456 14.34567890123456',
    },
  ];

  return mockData.map((data) => ({
    id: `sat-${data.noradId}`,
    name: data.name,
    noradId: data.noradId,
    category: data.category,
    tle: { line1: data.line1, line2: data.line2 },
    position: calculateSatellitePosition({ line1: data.line1, line2: data.line2 }) || undefined,
  }));
}

export function getMockLaunchSites(): { name: string; lat: number; lng: number; country: string; launches: number }[] {
  return [
    { name: 'Kennedy Space Center', lat: 28.5721, lng: -80.6480, country: 'USA', launches: 185 },
    { name: 'Cape Canaveral SFS', lat: 28.4889, lng: -80.5778, country: 'USA', launches: 238 },
    { name: 'Vandenberg SFB', lat: 34.7420, lng: -120.5724, country: 'USA', launches: 98 },
    { name: 'Baikonur Cosmodrome', lat: 45.9650, lng: 63.3050, country: 'Kazakhstan', launches: 1547 },
    { name: 'Guiana Space Centre', lat: 5.2322, lng: -52.7693, country: 'French Guiana', launches: 312 },
    { name: 'Jiuquan Satellite Center', lat: 40.9583, lng: 100.2916, country: 'China', launches: 195 },
    { name: 'Xichang Satellite Center', lat: 28.2463, lng: 102.0268, country: 'China', launches: 185 },
    { name: 'Wenchang Space Launch', lat: 19.6145, lng: 110.9512, country: 'China', launches: 25 },
    { name: 'Satish Dhawan Space Centre', lat: 13.7199, lng: 80.2304, country: 'India', launches: 89 },
    { name: 'Tanegashima Space Center', lat: 30.4010, lng: 130.9750, country: 'Japan', launches: 48 },
    { name: 'Plesetsk Cosmodrome', lat: 62.9271, lng: 40.5777, country: 'Russia', launches: 1618 },
    { name: 'Rocket Lab LC-1', lat: -39.2619, lng: 177.8646, country: 'New Zealand', launches: 45 },
    { name: 'Vostochny Cosmodrome', lat: 51.8843, lng: 128.3335, country: 'Russia', launches: 12 },
    { name: 'Esrange Space Center', lat: 67.8934, lng: 21.1059, country: 'Sweden', launches: 8 },
  ];
}
