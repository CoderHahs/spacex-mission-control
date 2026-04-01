# Implementation Plan: Satellitemap Artemis Tracker

## Overview

Transform the spacex-mission-control platform from a mock-data demo into a production-grade Artemis II mission tracker. Phase 1 (P0/P1) ships before the April 1, 2026 launch. Phase 2 (P2) is post-launch polish. Implementation uses the existing React 18 + TypeScript + Vite + Globe.gl + satellite.js stack with no new dependencies.

## Tasks

- [x]   1. Create core data models, constants, and utility functions
    - [x] 1.1 Extend types in `src/types/index.ts` with Artemis data models
        - Add `ArtemisPhase`, `ArtemisCrewMember`, `ArtemisMissionPhase`, `TrajectoryWaypoint`, `MoonPosition`, `CacheEntry<T>`, and extended `NavigationSection` type
        - _Requirements: 4.1–4.10, 5.2, 5.3, 6.2–6.4, 7.2_
    - [x] 1.2 Create `src/data/artemisData.ts` with hardcoded Artemis II mission constants
        - Define `ARTEMIS_LAUNCH_DATE` (April 1, 2026 22:24:00 UTC), crew array (Wiseman, Glover, Koch, Hansen), 12 mission timeline milestones, mission stats (685,000 mi, 10 days, 25,000 mph, 4,700 mi beyond Moon), phase transition thresholds, and NASA YouTube stream URL
        - Implement `getMissionPhase(launchDate, now)` returning exactly one `ArtemisMissionPhase` based on elapsed time thresholds
        - Implement `isInMissionWindow(launchDate, now)` returning true when absolute difference ≤ 10 days
        - _Requirements: 1.1, 2.1, 2.2, 3.1, 3.3, 3.4, 4.1–4.10, 8.1–8.3, 14.1_
    - [x] 1.3 Write property test: Mission phase totality and determinism (Property 1)
        - **Property 1: Mission phase totality and determinism**
        - For any Date value, `getMissionPhase(LAUNCH_DATE, date)` returns exactly one valid `ArtemisMissionPhase` from the defined set
        - **Validates: Requirement 4.9**
    - [x] 1.4 Write property test: Mission phase monotonicity (Property 2)
        - **Property 2: Mission phase monotonicity**
        - For any two Date values t1 < t2, the phase for t1 is equal to or earlier in sequence than the phase for t2
        - **Validates: Requirement 4.10**
    - [x] 1.5 Write property test: Mission window detection correctness (Property 5)
        - **Property 5: Mission window detection correctness**
        - For any launch Date and current Date, `isInMissionWindow` returns true iff absolute difference ≤ 10 days
        - **Validates: Requirements 8.1, 8.2, 8.3**

- [x]   2. Create cache utility and API service layer
    - [x] 2.1 Create `src/utils/cacheUtils.ts` with `fetchWithCache<T>(key, fetcher, ttlMs)`
        - Implement localStorage cache check with TTL validation
        - On cache hit (non-expired), return cached data without calling fetcher
        - On cache miss or expired, call fetcher, store result with timestamp, return data
        - On fetcher failure with stale cache available, return stale data
        - On fetcher failure with no cache, propagate error
        - Wrap all localStorage operations in try-catch for quota/private-browsing resilience
        - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_
    - [x] 2.2 Write property test: Cache hit avoids fetcher call (Property 6)
        - **Property 6: Cache hit avoids fetcher call**
        - If a valid (non-expired) cache entry exists, cached data is returned and fetcher is not invoked
        - **Validates: Requirement 13.1**
    - [x] 2.3 Write property test: Stale cache fallback on fetch failure (Property 7)
        - **Property 7: Stale cache fallback on fetch failure**
        - If fetcher fails and stale cache exists, stale data is returned instead of error
        - **Validates: Requirements 13.3, 10.2**

- [x]   3. Checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

- [x]   4. Wire real satellite data from CelesTrak
    - [x] 4.1 Update `src/services/satelliteApi.ts` with real CelesTrak integration
        - Implement `fetchTLEDataWithFallback(group)` using `fetchWithCache` with 2-hour TTL
        - Fetch from `https://celestrak.org/NORAD/elements/gp.php?GROUP={group}&FORMAT=JSON`
        - On success, parse TLE data and calculate positions via existing `calculateSatellitePosition`
        - On any failure, return `getMockSatellites()` — function must never reject
        - Filter out satellites with null positions before returning
        - _Requirements: 9.1, 9.2, 10.1, 10.2, 10.3, 10.4, 16.1, 16.2_
    - [x] 4.2 Update `src/components/SatelliteTracker.tsx` to consume real data
        - Replace mock data calls with `fetchTLEDataWithFallback` for groups: stations, starlink, gps-ops, weather, science
        - Add loading state while fetching
        - Display satellite count and last-updated timestamp
        - Fall back to mock data on error
        - _Requirements: 9.1, 9.2, 9.3, 9.4_
    - [x] 4.3 Write property test: Satellite fallback never rejects (Property 8)
        - **Property 8: Satellite fallback never rejects**
        - For any satellite group string, `fetchTLEDataWithFallback(group)` resolves successfully, returning real or mock data
        - **Validates: Requirement 10.4**
    - [x] 4.4 Write property test: Null satellite position filtering (Property 11)
        - **Property 11: Null satellite position filtering**
        - After filtering, output contains no satellites with null positions and all valid-position satellites are preserved
        - **Validates: Requirements 16.1, 16.2**

- [x]   5. Wire real launch data from Launch Library 2
    - [x] 5.1 Update `src/services/launchApi.ts` with real Launch Library 2 integration
        - Wire `getUpcomingLaunches()` and `getPastLaunches()` to use `fetchWithCache` with 30-minute TTL
        - On 429 rate-limit or failure, fall back to `getMockUpcomingLaunches()` / `getMockPastLaunches()`
        - _Requirements: 11.1, 11.4, 11.5_
    - [x] 5.2 Update `src/components/LaunchDashboard.tsx` to consume real data
        - Replace mock data calls with real API functions
        - Pin Artemis II as featured launch at top of list
        - Add loading and error states
        - _Requirements: 11.1, 11.2, 11.3_

- [x]   6. Wire real news feed from Spaceflight News API
    - [x] 6.1 Update `src/services/newsApi.ts` with Spaceflight News API v4 integration
        - Fetch from `https://api.spaceflightnewsapi.net/v4/articles?limit=20`
        - Filter Artemis-related articles into a featured section
        - No mock fallback for news — show error state on failure
        - _Requirements: 12.1, 12.2_
    - [x] 6.2 Update `src/components/NewsFeed.tsx` to consume real data
        - Display featured (Artemis-related) and recent article sections
        - Add loading skeleton state
        - Show error message with retry button on API failure
        - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_
    - [x] 6.3 Write property test: News feed Artemis filtering (Property 10)
        - **Property 10: News feed Artemis filtering**
        - Featured section contains only Artemis-related articles, and no Artemis-related articles appear exclusively in the non-featured section
        - **Validates: Requirement 12.2**

- [x]   7. Checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

- [x]   8. Build the ArtemisTracker component
    - [x] 8.1 Create `src/components/ArtemisTracker.tsx`
        - Render live countdown (days, hours, minutes, seconds) using existing `useCountdown` hook with `ARTEMIS_LAUNCH_DATE`
        - After launch, replace countdown with current mission phase indicator via `getMissionPhase`
        - Render crew cards for all 4 astronauts (name, role, agency, bio, image)
        - Render mission timeline with 12 milestones, highlighting active phase and marking completed/upcoming
        - Display mission stats (distance, duration, reentry speed, distance beyond Moon)
        - Include link to NASA YouTube live stream
        - Accept `onNavigateToGlobe` prop for globe navigation
        - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 14.1_
    - [x] 8.2 Write property test: Countdown calculation correctness (Property 9)
        - **Property 9: Countdown calculation correctness**
        - For any Date before launch, countdown values equal the actual time difference between current date and launch date
        - **Validates: Requirement 1.1**

- [x]   9. Create Moon position calculator and trajectory generator
    - [x] 9.1 Create `src/utils/moonPosition.ts` with `getMoonPosition(date)`
        - Implement simplified lunar ephemeris based on Meeus model
        - Return `MoonPosition` with lat in [-28.5, 28.5], lng in [-180, 180], distance in [356000, 407000] km
        - Pure function with no side effects
        - _Requirements: 6.2, 6.3, 6.4_
    - [x] 9.2 Implement `generateArtemisTrajectory(phase)` in `src/data/artemisData.ts`
        - Generate earth-orbit waypoints as circular paths at ~200km altitude with 28.5° inclination
        - Generate translunar/lunar-flyby/return waypoints as parametric curve with altitude peaking at ~384,400 km
        - Return at least 2 waypoints for any valid phase
        - All waypoints satisfy lat [-90,90], lng [-180,180], alt >= 0
        - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
    - [x] 9.3 Write property test: Trajectory waypoint validity (Property 3)
        - **Property 3: Trajectory waypoint validity**
        - For any valid `ArtemisMissionPhase`, output has ≥ 2 waypoints with lat in [-90,90], lng in [-180,180], alt ≥ 0
        - **Validates: Requirements 5.2, 5.3**
    - [x] 9.4 Write property test: Moon position within physical bounds (Property 4)
        - **Property 4: Moon position within physical bounds**
        - For any Date, `getMoonPosition` returns lat in [-28.5, 28.5], lng in [-180, 180], distance in [356000, 407000]
        - **Validates: Requirements 6.2, 6.3, 6.4**

- [x]   10. Update GlobeVisualization with Artemis trajectory and Moon
    - [x] 10.1 Modify `src/components/GlobeVisualization.tsx` to accept Artemis props
        - Add `showArtemisTrajectory`, `currentMissionPhase` props
        - Render Moon as secondary sphere using `getMoonPosition` with artistic scaling (~3-5 Earth radii distance, ~0.15 Earth radii size)
        - Update Moon position every 60 seconds via interval
        - Overlay trajectory arcs using Globe.gl `arcsData` layer, color-coded by phase
        - Animate Orion spacecraft marker along trajectory based on current phase
        - Toggle trajectory visibility via `showArtemisTrajectory` prop
        - _Requirements: 5.1, 5.4, 5.5, 5.6, 5.7, 6.1, 6.5, 6.6_

- [x]   11. Update Navigation and App routing
    - [x] 11.1 Modify `src/components/Navigation.tsx`
        - Add "Artemis II" tab with Moon icon (from Lucide) positioned second (after Globe)
        - Add `NavigationSection` type to include `'artemis'`
        - Show pulsing LIVE badge during mission window using `isInMissionWindow`
        - Section order: globe, artemis, launches, satellites, missions, analytics, news
        - _Requirements: 7.1, 7.2, 7.3, 8.1, 8.2_
    - [x] 11.2 Modify `src/App.tsx` to wire ArtemisTracker
        - Lazy-load ArtemisTracker with `React.lazy` and `Suspense` with loading skeleton fallback
        - Render ArtemisTracker when `activeSection === 'artemis'`
        - Pass `showArtemisTrajectory` and `currentMissionPhase` to GlobeVisualization when artemis section is active
        - _Requirements: 7.3, 15.1, 15.2_

- [x]   12. Final checkpoint - Ensure all tests pass
    - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check library and validate universal correctness properties from the design document
- All Phase 1 tasks (1–12) must ship before April 1, 2026 launch
- No new npm dependencies are needed — all functionality uses the existing stack
