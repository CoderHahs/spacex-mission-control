// Launch Library 2 API Types
export interface Launch {
  id: string;
  name: string;
  status: LaunchStatus;
  net: string; // Date-time string
  window_start: string;
  window_end: string;
  mission?: Mission;
  pad: LaunchPad;
  rocket: Rocket;
  launch_service_provider: LaunchServiceProvider;
  image?: string;
  infographic?: string;
  webcast_live: boolean;
  vidURLs?: VideoURL[];
}

export interface LaunchStatus {
  id: number;
  name: string;
  abbrev: string;
  description: string;
}

export interface Mission {
  id: number;
  name: string;
  description: string;
  type: string;
  orbit?: Orbit;
}

export interface Orbit {
  id: number;
  name: string;
  abbrev: string;
}

export interface LaunchPad {
  id: number;
  name: string;
  location: Location;
  latitude: string;
  longitude: string;
  map_url?: string;
  total_launch_count: number;
}

export interface Location {
  id: number;
  name: string;
  country_code: string;
}

export interface Rocket {
  id: number;
  configuration: RocketConfiguration;
}

export interface RocketConfiguration {
  id: number;
  name: string;
  full_name: string;
  family: string;
  variant?: string;
  image_url?: string;
}

export interface LaunchServiceProvider {
  id: number;
  name: string;
  abbrev: string;
  type: string;
  country_code: string;
  logo_url?: string;
}

export interface VideoURL {
  priority: number;
  title: string;
  description: string;
  url: string;
}

// Satellite Types
export interface Satellite {
  id: string;
  name: string;
  noradId: number;
  tle: TLE;
  category: SatelliteCategory;
  position?: SatellitePosition;
  orbitalData?: OrbitalData;
}

export interface TLE {
  line1: string;
  line2: string;
}

export interface SatellitePosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
}

export interface OrbitalData {
  inclination: number;
  eccentricity: number;
  perigee: number;
  apogee: number;
  period: number;
}

export type SatelliteCategory = 
  | 'communication'
  | 'weather'
  | 'navigation'
  | 'scientific'
  | 'military'
  | 'earth-observation'
  | 'iss'
  | 'starlink'
  | 'other';

// Space News Types
export interface SpaceArticle {
  id: number;
  title: string;
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
  featured: boolean;
  launches?: { launch_id: string; provider: string }[];
  events?: { event_id: number; provider: string }[];
}

// Mission Types
export interface SpaceMission {
  id: string;
  name: string;
  description: string;
  status: MissionStatus;
  type: MissionType;
  startDate: string;
  endDate?: string;
  agency: string;
  crew?: CrewMember[];
  objectives?: string[];
  progress?: number;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  agency: string;
  nationality: string;
  image?: string;
}

export type MissionStatus = 'planned' | 'in-progress' | 'completed' | 'failed';
export type MissionType = 'crewed' | 'robotic' | 'cargo' | 'scientific' | 'commercial';

// Analytics Types
export interface LaunchStats {
  totalLaunches: number;
  successfulLaunches: number;
  failedLaunches: number;
  upcomingLaunches: number;
  launchesByProvider: { name: string; count: number }[];
  launchesByYear: { year: number; count: number }[];
  launchesByMonth: { month: string; count: number }[];
}

export interface SatelliteStats {
  totalSatellites: number;
  byCategory: { category: string; count: number }[];
  byCountry: { country: string; count: number }[];
  byAltitude: { range: string; count: number }[];
}

// Globe Types
export interface GlobePoint {
  lat: number;
  lng: number;
  altitude?: number;
  label?: string;
  color?: string;
  size?: number;
}

export interface OrbitalPath {
  points: { lat: number; lng: number; alt: number }[];
  color: string;
  opacity: number;
}

// Theme
export type Theme = 'light' | 'dark';

// API Response Types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
