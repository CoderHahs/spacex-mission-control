import type {
    ArtemisCrewMember,
    ArtemisMissionPhase,
    ArtemisPhase,
    TrajectoryWaypoint,
} from "../types/index";

// Artemis II Launch Date: April 1, 2026 at 6:35 PM EDT = 22:35 UTC
export const ARTEMIS_LAUNCH_DATE = new Date("2026-04-01T22:35:00Z");

// NASA YouTube Live Stream URL
export const NASA_STREAM_URL = "https://www.youtube.com/watch?v=m3kR2KK8TEs";
export const NASA_STREAM_EMBED_URL =
    "https://www.youtube.com/embed/NaJklsJonD4";

// Artemis II Crew
export const ARTEMIS_CREW: ArtemisCrewMember[] = [
    {
        name: "Reid Wiseman",
        role: "Commander",
        agency: "NASA",
        bio: "Navy test pilot and NASA astronaut who previously flew on Expedition 41 aboard the ISS. Selected to command the first crewed Artemis mission.",
        imageUrl: "/images/crew/wiseman.jpg",
    },
    {
        name: "Victor Glover",
        role: "Pilot",
        agency: "NASA",
        bio: "Navy fighter pilot and NASA astronaut who served as pilot on SpaceX Crew-1, the first operational crewed flight of the Crew Dragon spacecraft.",
        imageUrl: "/images/crew/glover.jpg",
    },
    {
        name: "Christina Koch",
        role: "Mission Specialist",
        agency: "NASA",
        bio: "NASA astronaut who set the record for the longest single spaceflight by a woman at 328 days aboard the ISS and participated in the first all-female spacewalk.",
        imageUrl: "/images/crew/koch.jpg",
    },
    {
        name: "Jeremy Hansen",
        role: "Mission Specialist",
        agency: "CSA",
        bio: "Canadian Space Agency astronaut and former CF-18 fighter pilot. The first Canadian to fly on a lunar mission.",
        imageUrl: "/images/crew/hansen.jpg",
    },
];

// Mission Statistics
export const MISSION_STATS = {
    totalDistance: "685,000 mi",
    duration: "10 days",
    reentrySpeed: "25,000 mph",
    distanceBeyondMoon: "4,700 mi",
};

// Phase transition thresholds (in minutes for early phases, days for later)
export const PHASE_THRESHOLDS = {
    ascentMinutes: 8.1, // T+0 to T+8:06 (MECO)
    earthOrbitMinutes: 90, // 2 Earth orbits
    translunarDays: 3.5, // TLI burn → coast
    lunarFlybyDays: 5, // Closest approach Day 4
    returnDays: 9.5, // Return coast
    reentryDays: 10, // Reentry corridor
};

// 12 Mission Timeline Milestones
export const MISSION_TIMELINE: ArtemisPhase[] = [
    {
        id: "launch",
        name: "Liftoff",
        description: "SLS launches from Kennedy Space Center LC-39B",
        timestamp: new Date("2026-04-01T22:24:00Z"),
        missionElapsedTime: "T+00:00",
        status: "upcoming",
    },
    {
        id: "meco",
        name: "Main Engine Cutoff",
        description:
            "Core stage engines shut down after 8 minutes of powered flight",
        timestamp: new Date("2026-04-01T22:32:06Z"),
        missionElapsedTime: "T+08:06",
        status: "upcoming",
    },
    {
        id: "orbit-insertion",
        name: "Earth Orbit Insertion",
        description:
            "ICPS places Orion into low Earth orbit for systems checkout",
        timestamp: new Date("2026-04-01T22:34:00Z"),
        missionElapsedTime: "T+10:00",
        status: "upcoming",
    },
    {
        id: "tli",
        name: "Trans-Lunar Injection",
        description: "ICPS burn sends Orion on trajectory toward the Moon",
        timestamp: new Date("2026-04-01T23:54:00Z"),
        missionElapsedTime: "T+01:30",
        status: "upcoming",
    },
    {
        id: "icps-separation",
        name: "ICPS Separation",
        description:
            "Orion separates from the Interim Cryogenic Propulsion Stage",
        timestamp: new Date("2026-04-02T00:24:00Z"),
        missionElapsedTime: "T+02:00",
        status: "upcoming",
    },
    {
        id: "outbound-coast",
        name: "Outbound Coast",
        description:
            "Crew performs navigation checks and system tests during transit to Moon",
        timestamp: new Date("2026-04-03T22:24:00Z"),
        missionElapsedTime: "Day 2",
        status: "upcoming",
    },
    {
        id: "lunar-approach",
        name: "Lunar Approach",
        description: "Orion approaches the Moon for powered flyby maneuver",
        timestamp: new Date("2026-04-05T10:24:00Z"),
        missionElapsedTime: "Day 4",
        status: "upcoming",
    },
    {
        id: "closest-approach",
        name: "Closest Lunar Approach",
        description:
            "Orion passes approximately 4,700 miles beyond the far side of the Moon",
        timestamp: new Date("2026-04-05T22:24:00Z"),
        missionElapsedTime: "Day 4",
        status: "upcoming",
    },
    {
        id: "return-trajectory",
        name: "Return Trajectory Burn",
        description:
            "Engine burn sets Orion on free-return trajectory back to Earth",
        timestamp: new Date("2026-04-06T22:24:00Z"),
        missionElapsedTime: "Day 5",
        status: "upcoming",
    },
    {
        id: "return-coast",
        name: "Return Coast",
        description: "Crew conducts experiments and prepares for Earth reentry",
        timestamp: new Date("2026-04-08T22:24:00Z"),
        missionElapsedTime: "Day 7",
        status: "upcoming",
    },
    {
        id: "reentry",
        name: "Atmospheric Reentry",
        description:
            "Orion reenters Earth atmosphere at approximately 25,000 mph",
        timestamp: new Date("2026-04-11T10:24:00Z"),
        missionElapsedTime: "Day 10",
        status: "upcoming",
    },
    {
        id: "splashdown",
        name: "Splashdown",
        description:
            "Orion splashes down in the Pacific Ocean, completing the mission",
        timestamp: new Date("2026-04-11T22:24:00Z"),
        missionElapsedTime: "Day 10",
        status: "upcoming",
    },
];

/**
 * Determines the current Artemis II mission phase based on elapsed time.
 * Returns exactly one phase for any valid date input.
 * Phase transitions are monotonic — later dates never return earlier phases.
 */
export function getMissionPhase(
    launchDate: Date,
    now: Date,
): ArtemisMissionPhase {
    const elapsedMs = now.getTime() - launchDate.getTime();
    const elapsedMinutes = elapsedMs / (1000 * 60);
    const elapsedDays = elapsedMinutes / (60 * 24);

    if (elapsedMs < 0) return "pre-launch";
    if (elapsedMinutes < 8.1) return "ascent";
    if (elapsedMinutes < 90) return "earth-orbit";
    if (elapsedDays < 3.5) return "translunar";
    if (elapsedDays < 5) return "lunar-flyby";
    if (elapsedDays < 9.5) return "return";
    if (elapsedDays < 10) return "reentry";
    return "splashdown";
}

/**
 * Returns true when the current time is within the mission window
 * (absolute difference between now and launch ≤ 10 days).
 */
export function isInMissionWindow(launchDate: Date, now: Date): boolean {
    const diffMs = Math.abs(now.getTime() - launchDate.getTime());
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays <= 10;
}

/**
 * Computes altitude along the lunar transfer trajectory.
 * @param t - Normalized parameter [0, 1] where 0 = Earth departure, 1 = Earth return
 * @returns Altitude in km, peaking at ~384,400 km near t = 0.45
 */
function computeLunarTransferAltitude(t: number): number {
    // Sinusoidal profile: starts at ~200km (LEO), peaks at ~384,400km (lunar distance), returns to ~200km
    const peakAlt = 384400;
    const baseAlt = 200;
    return baseAlt + (peakAlt - baseAlt) * Math.sin(t * Math.PI);
}

/**
 * Computes lat/lng along the lunar transfer trajectory.
 * @param t - Normalized parameter [0, 1]
 * @returns Object with lat and lng values within valid ranges
 */
function computeLunarTransferLatLng(t: number): { lat: number; lng: number } {
    // Outbound: spacecraft departs from ~28.5° inclination orbit (KSC latitude)
    // Travels toward the Moon's orbital plane, loops around, and returns
    // Latitude oscillates with decreasing amplitude as spacecraft moves away from Earth
    const lat =
        28.5 * Math.sin(t * 4 * Math.PI) * (1 - 0.5 * Math.sin(t * Math.PI));

    // Longitude advances continuously through the transfer
    // Start near KSC longitude (-80.6°), sweep through full range
    const lng = ((((-80.6 + t * 540) % 360) + 360) % 360) - 180;

    return { lat, lng };
}

/**
 * Generates trajectory waypoints for the Artemis II mission based on the current phase.
 *
 * - Earth-orbit / pre-launch / ascent: circular orbit at ~200km altitude with 28.5° inclination
 * - Translunar / lunar-flyby / return: parametric curve with altitude peaking at ~384,400 km
 * - Reentry / splashdown: return-phase waypoints (spacecraft approaching Earth)
 *
 * Returns at least 2 waypoints for any valid ArtemisMissionPhase.
 * All waypoints satisfy: lat in [-90, 90], lng in [-180, 180], alt >= 0.
 */
export function generateArtemisTrajectory(
    phase: ArtemisMissionPhase,
): TrajectoryWaypoint[] {
    const waypoints: TrajectoryWaypoint[] = [];

    // Earth orbit phase: 2 circular orbits at ~200km, inclination ~28.5°
    if (
        phase === "earth-orbit" ||
        phase === "pre-launch" ||
        phase === "ascent"
    ) {
        for (let i = 0; i <= 720; i += 5) {
            const radians = (i * Math.PI) / 180;
            waypoints.push({
                lat: 28.5 * Math.sin(radians),
                lng: ((((i * 0.5 - 80.6) % 360) + 360) % 360) - 180,
                alt: 200,
                phase: "earth-orbit",
            });
        }
    }

    // TLI + Lunar flyby + Return: parametric curve Earth → Moon → Earth
    if (
        phase === "translunar" ||
        phase === "lunar-flyby" ||
        phase === "return"
    ) {
        const numPoints = 200;
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints; // 0 to 1 normalized
            const alt = computeLunarTransferAltitude(t);
            const { lat, lng } = computeLunarTransferLatLng(t);
            const currentPhase: ArtemisMissionPhase =
                t < 0.35 ? "translunar" : t < 0.5 ? "lunar-flyby" : "return";
            waypoints.push({ lat, lng, alt, phase: currentPhase });
        }
    }

    // Reentry / splashdown: generate return-phase waypoints (approaching Earth)
    if (phase === "reentry" || phase === "splashdown") {
        const numPoints = 50;
        for (let i = 0; i <= numPoints; i++) {
            const t = i / numPoints; // 0 to 1 normalized
            // Altitude decreases from ~50,000 km down to near 0
            const alt = 50000 * (1 - t) * (1 - t);
            // Latitude converges toward Pacific splashdown zone (~25°N)
            const lat = 28.5 * (1 - t) + 25 * t;
            // Longitude converges toward Pacific (~-155°)
            const lng = -120 * (1 - t) + -155 * t;
            waypoints.push({
                lat,
                lng,
                alt,
                phase: t < 0.7 ? "reentry" : "splashdown",
            });
        }
    }

    return waypoints;
}
