# Requirements Document

## Introduction

This document defines the requirements for the Artemis Tracker feature, which transforms the spacex-mission-control platform into a production-grade space tracking application centered around the Artemis II lunar mission (launching April 1, 2026 at 6:24 PM EDT). The feature encompasses a dedicated mission tracker with countdown and crew profiles, real API data wiring for satellites, launches, and news, Artemis trajectory visualization on the 3D globe with Moon rendering, and navigation updates to prominently feature the Artemis II mission.

## Glossary

- **ArtemisTracker**: The React component providing the dedicated Artemis II mission page with countdown, crew cards, timeline, phase indicator, and NASA stream link.
- **GlobeVisualization**: The 3D globe component built on Globe.gl that renders Earth, satellite positions, launch sites, Artemis trajectory arcs, and the Moon.
- **Navigation**: The top-level navigation component controlling section switching across the application.
- **SatelliteTracker**: The component displaying real-time satellite positions using TLE data from CelesTrak.
- **LaunchDashboard**: The component displaying upcoming and past launches from Launch Library 2.
- **NewsFeed**: The component displaying space news articles from Spaceflight News API v4.
- **MissionPhaseEngine**: The logic (getMissionPhase function) that determines the current Artemis II mission phase based on elapsed time from launch.
- **TrajectoryGenerator**: The logic (generateArtemisTrajectory function) that produces trajectory waypoints for a given mission phase.
- **CacheService**: The fetchWithCache utility providing localStorage-based caching with TTL for API responses.
- **MoonPositionCalculator**: The logic (getMoonPosition function) computing the Moon's approximate position using simplified lunar ephemeris.
- **MissionWindowDetector**: The logic (isInMissionWindow function) determining whether the current time falls within the Artemis II mission window.
- **FallbackService**: The fetchTLEDataWithFallback function that fetches real satellite data and falls back to mock data on failure.
- **LIVE_Badge**: The pulsing visual indicator shown on the Artemis II navigation tab during the mission window.
- **ArtemisMissionPhase**: The enumerated type representing the eight sequential mission phases from pre-launch through splashdown.
- **TrajectoryWaypoint**: A data point with latitude, longitude, altitude, and phase describing a position along the Artemis trajectory.
- **CacheEntry**: A localStorage record containing cached data, a timestamp, and a TTL value.
- **MoonPosition**: A data structure containing the Moon's sub-lunar latitude, longitude, and distance from Earth center.

## Requirements

### Requirement 1: Artemis II Countdown Display

**User Story:** As a space enthusiast, I want to see a live countdown to the Artemis II launch, so that I can track exactly how much time remains before liftoff.

#### Acceptance Criteria

1. WHEN the ArtemisTracker renders before the launch date, THE ArtemisTracker SHALL display a countdown showing days, hours, minutes, and seconds remaining until April 1, 2026 at 22:24:00 UTC.
2. WHEN the current time passes the launch date, THE ArtemisTracker SHALL replace the countdown with the current mission phase indicator.
3. THE ArtemisTracker SHALL update the countdown display every second.

### Requirement 2: Crew Card Display

**User Story:** As a space enthusiast, I want to see profiles of the Artemis II crew, so that I can learn about the astronauts on this historic mission.

#### Acceptance Criteria

1. THE ArtemisTracker SHALL display crew cards for all 4 Artemis II astronauts: Reid Wiseman (Commander, NASA), Victor Glover (Pilot, NASA), Christina Koch (Mission Specialist, NASA), and Jeremy Hansen (Mission Specialist, CSA).
2. WHEN a crew card is rendered, THE ArtemisTracker SHALL display the astronaut name, role, agency, bio, and image for each crew member.

### Requirement 3: Mission Timeline and Phase Indicator

**User Story:** As a space enthusiast, I want to see the Artemis II mission timeline with the current phase highlighted, so that I can follow mission progress in real time.

#### Acceptance Criteria

1. THE ArtemisTracker SHALL display a mission timeline containing 12 key milestones from liftoff through splashdown.
2. WHEN the mission is in progress, THE ArtemisTracker SHALL highlight the currently active phase and mark completed phases as completed and future phases as upcoming.
3. WHEN a timeline milestone is displayed, THE ArtemisTracker SHALL show the milestone name, description, and mission elapsed time.
4. THE ArtemisTracker SHALL display mission statistics including total distance (685,000 miles), duration (10 days), reentry speed (25,000 mph), and distance beyond the Moon (4,700 miles).

### Requirement 4: Mission Phase Determination

**User Story:** As a developer, I want the system to determine the current mission phase based on elapsed time, so that all components can reflect the correct mission state.

#### Acceptance Criteria

1. WHEN the current time is before the launch date, THE MissionPhaseEngine SHALL return the pre-launch phase.
2. WHEN the elapsed time since launch is between 0 and 8.1 minutes, THE MissionPhaseEngine SHALL return the ascent phase.
3. WHEN the elapsed time since launch is between 8.1 and 90 minutes, THE MissionPhaseEngine SHALL return the earth-orbit phase.
4. WHEN the elapsed time since launch is between 90 minutes and 3.5 days, THE MissionPhaseEngine SHALL return the translunar phase.
5. WHEN the elapsed time since launch is between 3.5 and 5 days, THE MissionPhaseEngine SHALL return the lunar-flyby phase.
6. WHEN the elapsed time since launch is between 5 and 9.5 days, THE MissionPhaseEngine SHALL return the return phase.
7. WHEN the elapsed time since launch is between 9.5 and 10 days, THE MissionPhaseEngine SHALL return the reentry phase.
8. WHEN the elapsed time since launch is 10 days or more, THE MissionPhaseEngine SHALL return the splashdown phase.
9. THE MissionPhaseEngine SHALL return exactly one phase for any valid date input.
10. WHEN given two timestamps t1 and t2 where t1 is earlier than t2, THE MissionPhaseEngine SHALL return a phase for t1 that is equal to or earlier in sequence than the phase for t2.

### Requirement 5: Artemis Trajectory Visualization

**User Story:** As a space enthusiast, I want to see the Artemis II flight path on the 3D globe, so that I can visualize the spacecraft's journey to the Moon and back.

#### Acceptance Criteria

1. WHEN the Artemis trajectory is enabled, THE GlobeVisualization SHALL render trajectory arcs on the 3D globe representing the Artemis II flight path.
2. THE TrajectoryGenerator SHALL produce at least 2 waypoints for any valid mission phase.
3. THE TrajectoryGenerator SHALL produce waypoints where latitude is in the range [-90, 90], longitude is in the range [-180, 180], and altitude is non-negative.
4. WHEN the earth-orbit phase is active, THE GlobeVisualization SHALL render circular orbit paths at approximately 200 km altitude.
5. WHEN the translunar or lunar-flyby phase is active, THE GlobeVisualization SHALL render trajectory arcs with altitude increasing toward the Moon and then decreasing on return.
6. THE GlobeVisualization SHALL color-code trajectory segments by mission phase.
7. THE GlobeVisualization SHALL animate the Orion spacecraft marker along the trajectory based on the current mission phase.

### Requirement 6: Moon Rendering on Globe

**User Story:** As a space enthusiast, I want to see the Moon on the 3D globe, so that I can understand the spatial relationship between Earth, the Moon, and the Artemis trajectory.

#### Acceptance Criteria

1. THE GlobeVisualization SHALL render the Moon as a secondary sphere on the 3D globe at the Moon's approximate real-time position.
2. THE MoonPositionCalculator SHALL compute the Moon's sub-lunar latitude within the range [-28.5, 28.5] degrees.
3. THE MoonPositionCalculator SHALL compute the Moon's sub-lunar longitude within the range [-180, 180] degrees.
4. THE MoonPositionCalculator SHALL compute the Moon's distance from Earth center within the range [356,000, 407,000] km.
5. THE GlobeVisualization SHALL use artistic scaling for the Moon (approximately 10-20x closer and 3-5x larger than true scale) so that the Moon is visible on the globe.
6. THE GlobeVisualization SHALL update the Moon's position every 60 seconds.

### Requirement 7: Navigation with Artemis II Tab

**User Story:** As a user, I want to access the Artemis II tracker from the main navigation, so that I can quickly find the mission page.

#### Acceptance Criteria

1. THE Navigation SHALL include an Artemis II tab with a Moon icon positioned second in the navigation order (after Globe).
2. THE Navigation SHALL support the following sections in order: globe, artemis, launches, satellites, missions, analytics, news.
3. WHEN the user clicks the Artemis II tab, THE Navigation SHALL switch the active section to the Artemis tracker.

### Requirement 8: LIVE Badge During Mission Window

**User Story:** As a user, I want to see a visual indicator when the Artemis II mission is actively happening, so that I know to check the tracker for live updates.

#### Acceptance Criteria

1. WHILE the current time is within 10 days before or 10 days after the launch date, THE Navigation SHALL display a pulsing LIVE_Badge on the Artemis II tab.
2. WHILE the current time is outside the mission window, THE Navigation SHALL hide the LIVE_Badge.
3. THE MissionWindowDetector SHALL return true when the absolute difference between the current time and the launch date is 10 days or less, and false otherwise.

### Requirement 9: Real Satellite Data from CelesTrak

**User Story:** As a space enthusiast, I want to see real satellite positions on the globe, so that I can track actual satellites instead of mock data.

#### Acceptance Criteria

1. WHEN the SatelliteTracker loads, THE SatelliteTracker SHALL fetch real TLE data from CelesTrak for the configured satellite groups (stations, starlink, gps-ops, weather, science).
2. WHEN the CelesTrak API returns valid data, THE SatelliteTracker SHALL display satellite positions calculated from the TLE data.
3. WHEN the SatelliteTracker is loading data, THE SatelliteTracker SHALL display a loading state.
4. THE SatelliteTracker SHALL display the satellite count and last-updated timestamp.

### Requirement 10: Satellite Data Caching and Fallback

**User Story:** As a user, I want the satellite tracker to work even when the API is unavailable, so that I always see satellite data.

#### Acceptance Criteria

1. WHEN the CelesTrak API returns data successfully, THE FallbackService SHALL cache the response in localStorage with a 2-hour TTL.
2. WHEN the CelesTrak API fails, THE FallbackService SHALL return stale cached data if available.
3. WHEN the CelesTrak API fails and no cached data exists, THE FallbackService SHALL return mock satellite data.
4. THE FallbackService SHALL resolve successfully for any satellite group input and never reject the promise.

### Requirement 11: Real Launch Data from Launch Library 2

**User Story:** As a space enthusiast, I want to see real upcoming and past launches, so that I can follow the global launch schedule.

#### Acceptance Criteria

1. WHEN the LaunchDashboard loads, THE LaunchDashboard SHALL fetch real launch data from Launch Library 2 for upcoming and past launches.
2. THE LaunchDashboard SHALL pin Artemis II as a featured launch at the top of the launch list.
3. WHEN the LaunchDashboard is loading data, THE LaunchDashboard SHALL display a loading state.
4. IF the Launch Library 2 API returns a 429 rate-limit response, THEN THE LaunchDashboard SHALL fall back to mock launch data.
5. WHEN launch data is fetched successfully, THE CacheService SHALL cache the response in localStorage with a 30-minute TTL.

### Requirement 12: Real News Feed from Spaceflight News API

**User Story:** As a space enthusiast, I want to read real space news articles, so that I can stay informed about current space events.

#### Acceptance Criteria

1. WHEN the NewsFeed loads, THE NewsFeed SHALL fetch articles from Spaceflight News API v4.
2. THE NewsFeed SHALL filter and feature Artemis-related articles in a dedicated featured section.
3. WHEN the NewsFeed is loading data, THE NewsFeed SHALL display a loading skeleton state.
4. IF the Spaceflight News API fails, THEN THE NewsFeed SHALL display an error message with a retry button.
5. WHEN the user clicks the retry button, THE NewsFeed SHALL re-attempt fetching articles from the API.

### Requirement 13: Cache-Aware Fetch Utility

**User Story:** As a developer, I want a generic caching utility for API calls, so that the application respects rate limits and provides offline resilience.

#### Acceptance Criteria

1. WHEN a cache entry exists and the elapsed time since caching is less than the TTL, THE CacheService SHALL return the cached data without calling the fetcher function.
2. WHEN no cache entry exists or the cache entry has expired, THE CacheService SHALL call the fetcher function and store the result in localStorage with the provided TTL.
3. IF the fetcher function fails and a stale cache entry exists, THEN THE CacheService SHALL return the stale cached data.
4. IF the fetcher function fails and no cache entry exists, THEN THE CacheService SHALL propagate the error.
5. IF localStorage is full or unavailable, THEN THE CacheService SHALL proceed without caching and fetch data directly from the API.

### Requirement 14: NASA Live Stream Link

**User Story:** As a space enthusiast, I want a link to the NASA live stream, so that I can watch the Artemis II mission live.

#### Acceptance Criteria

1. THE ArtemisTracker SHALL provide a link to the NASA YouTube live stream for the Artemis II mission.

### Requirement 15: Lazy Loading of Sections

**User Story:** As a user, I want the application to load quickly, so that I can start using it without long wait times.

#### Acceptance Criteria

1. THE Application SHALL lazy-load the ArtemisTracker component using React.lazy and Suspense.
2. WHEN a lazy-loaded section is loading, THE Application SHALL display a loading skeleton fallback.

### Requirement 16: Error Handling for Invalid TLE Data

**User Story:** As a developer, I want the system to handle malformed TLE data gracefully, so that a single bad satellite record does not break the globe visualization.

#### Acceptance Criteria

1. IF a satellite position calculation returns null for malformed TLE data, THEN THE SatelliteTracker SHALL skip that satellite from rendering and log a warning.
2. THE SatelliteTracker SHALL filter out satellites with null positions before passing data to the GlobeVisualization layers.
