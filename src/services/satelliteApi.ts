import * as satellite from 'satellite.js';
import type { Satellite, SatelliteCategory, SatellitePosition, TLE } from '@/types';

const CELESTRAK_BASE = 'https://celestrak.org/NORAD/elements/gp.php';

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

export async function fetchTLEData(group: string): Promise<CelestrakTLE[]> {
  const response = await fetch(`${CELESTRAK_BASE}?GROUP=${group}&FORMAT=JSON`);
  if (!response.ok) {
    throw new Error(`Failed to fetch TLE data: ${response.statusText}`);
  }
  return response.json();
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

export function categorizeByName(name: string): SatelliteCategory {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('starlink')) return 'starlink';
  if (lowerName.includes('iss') || lowerName.includes('zarya')) return 'iss';
  if (lowerName.includes('gps') || lowerName.includes('glonass') || lowerName.includes('galileo')) return 'navigation';
  if (lowerName.includes('goes') || lowerName.includes('noaa') || lowerName.includes('meteo')) return 'weather';
  if (lowerName.includes('intelsat') || lowerName.includes('ses') || lowerName.includes('telesat')) return 'communication';
  if (lowerName.includes('landsat') || lowerName.includes('sentinel') || lowerName.includes('worldview')) return 'earth-observation';
  if (lowerName.includes('usa') || lowerName.includes('nrol') || lowerName.includes('cosmos')) return 'military';
  if (lowerName.includes('hubble') || lowerName.includes('webb') || lowerName.includes('chandra')) return 'scientific';
  
  return 'other';
}

// Mock satellite data for development/fallback
export function getMockSatellites(): Satellite[] {
  const mockData: Array<{
    name: string;
    noradId: number;
    category: SatelliteCategory;
    line1: string;
    line2: string;
  }> = [
    {
      name: 'ISS (ZARYA)',
      noradId: 25544,
      category: 'iss',
      line1: '1 25544U 98067A   24045.54791667  .00016717  00000+0  30268-3 0  9993',
      line2: '2 25544  51.6416 205.3855 0004817 101.3267  16.4682 15.49924265438991',
    },
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
      name: 'HUBBLE SPACE TELESCOPE',
      noradId: 20580,
      category: 'scientific',
      line1: '1 20580U 90037B   24045.51111111  .00002543  00000+0  12543-3 0  9995',
      line2: '2 20580  28.4691 238.5432 0002834 226.5432 133.4321 15.09123456123456',
    },
    {
      name: 'GPS BIIR-2',
      noradId: 24876,
      category: 'navigation',
      line1: '1 24876U 97035A   24045.52222222  .00000043  00000+0  10000-3 0  9997',
      line2: '2 24876  55.4532  62.5432 0053234 236.5432 123.4321  2.00565234123456',
    },
    {
      name: 'NOAA 19',
      noradId: 33591,
      category: 'weather',
      line1: '1 33591U 09005A   24045.53333333  .00000123  00000+0  98765-4 0  9996',
      line2: '2 33591  99.1234  87.5432 0014567  88.5432 271.6789 14.12345678123456',
    },
    {
      name: 'INTELSAT 35E',
      noradId: 42818,
      category: 'communication',
      line1: '1 42818U 17041A   24045.54444444  .00000013  00000+0  00000+0 0  9994',
      line2: '2 42818   0.0234  89.5432 0003234 273.5432 163.4321  1.00270145123456',
    },
    {
      name: 'LANDSAT 9',
      noradId: 49260,
      category: 'earth-observation',
      line1: '1 49260U 21088A   24045.55555555  .00000234  00000+0  23456-4 0  9998',
      line2: '2 49260  98.2234 141.5432 0001234  96.5432 263.5789 14.57234567123456',
    },
    {
      name: 'COSMOS 2545',
      noradId: 46173,
      category: 'military',
      line1: '1 46173U 20052A   24045.56666666  .00000345  00000+0  34567-4 0  9999',
      line2: '2 46173  64.8234 234.5432 0012345 198.5432 161.4321 14.23456789123456',
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
