export { getUpcomingLaunches, getPastLaunches, getMockUpcomingLaunches, getMockPastLaunches } from './launchApi';
export { getLatestArticles, getFeaturedArticles, getMockArticles } from './newsApi';
export { 
  fetchTLEData, 
  fetchMultipleSatelliteGroups,
  calculateSatellitePosition, 
  calculateOrbitPath, 
  batchCalculatePositions,
  calculateMultipleOrbitPaths,
  getMockSatellites, 
  getMockLaunchSites,
  categorizeByName,
  SATELLITE_GROUPS,
  DEFAULT_SATELLITE_GROUPS,
  MINIMAL_SATELLITE_GROUPS,
  type SatelliteGroupKey
} from './satelliteApi';
export { getMockMissions, getMockMissionStats } from './missionApi';
