import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generateArtemisTrajectory } from "../data/artemisData";
import type { ArtemisMissionPhase } from "../types/index";

/**
 * Property 3: Trajectory waypoint validity
 *
 * For any valid ArtemisMissionPhase, generateArtemisTrajectory(phase) produces
 * an array of at least 2 waypoints, and every waypoint satisfies:
 * latitude in [-90, 90], longitude in [-180, 180], and altitude >= 0.
 *
 * **Validates: Requirements 5.2, 5.3**
 */

const ALL_PHASES: ArtemisMissionPhase[] = [
    "pre-launch",
    "ascent",
    "earth-orbit",
    "translunar",
    "lunar-flyby",
    "return",
    "reentry",
    "splashdown",
];

describe("Property 3: Trajectory waypoint validity", () => {
    it("should produce >= 2 waypoints with valid lat, lng, alt for any mission phase", () => {
        fc.assert(
            fc.property(
                fc.constantFrom(...ALL_PHASES),
                (phase: ArtemisMissionPhase) => {
                    const waypoints = generateArtemisTrajectory(phase);

                    // Must have at least 2 waypoints
                    expect(waypoints.length).toBeGreaterThanOrEqual(2);

                    // Every waypoint must satisfy geographic constraints
                    for (const wp of waypoints) {
                        expect(wp.lat).toBeGreaterThanOrEqual(-90);
                        expect(wp.lat).toBeLessThanOrEqual(90);
                        expect(wp.lng).toBeGreaterThanOrEqual(-180);
                        expect(wp.lng).toBeLessThanOrEqual(180);
                        expect(wp.alt).toBeGreaterThanOrEqual(0);
                    }
                },
            ),
            { numRuns: 1000 },
        );
    });
});
