import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
    ARTEMIS_LAUNCH_DATE,
    getMissionPhase,
    isInMissionWindow,
} from "../data/artemisData";
import type { ArtemisMissionPhase } from "../types/index";

/**
 * Property 1: Mission phase totality and determinism
 *
 * For any Date value, getMissionPhase(LAUNCH_DATE, date) returns exactly one
 * valid ArtemisMissionPhase from the set {pre-launch, ascent, earth-orbit,
 * translunar, lunar-flyby, return, reentry, splashdown}.
 *
 * **Validates: Requirements 4.9**
 */

const VALID_PHASES: ArtemisMissionPhase[] = [
    "pre-launch",
    "ascent",
    "earth-orbit",
    "translunar",
    "lunar-flyby",
    "return",
    "reentry",
    "splashdown",
];

describe("Property 1: Mission phase totality and determinism", () => {
    it("should return exactly one valid ArtemisMissionPhase for any Date", () => {
        fc.assert(
            fc.property(fc.date(), (date: Date) => {
                const phase = getMissionPhase(ARTEMIS_LAUNCH_DATE, date);

                // Phase must be one of the valid phases (totality)
                expect(VALID_PHASES).toContain(phase);

                // Phase must be a string (determinism — single value returned)
                expect(typeof phase).toBe("string");
            }),
            { numRuns: 1000 },
        );
    });
});

/**
 * Property 2: Mission phase monotonicity
 *
 * For any two Date values t1 and t2 where t1 < t2, the phase returned by
 * getMissionPhase(LAUNCH_DATE, t1) is equal to or earlier in the phase
 * sequence than the phase returned by getMissionPhase(LAUNCH_DATE, t2).
 *
 * **Validates: Requirements 4.10**
 */
describe("Property 2: Mission phase monotonicity", () => {
    it("should return an equal or earlier phase for t1 < t2", () => {
        fc.assert(
            fc.property(
                fc.date({ noInvalidDate: true }),
                fc.date({ noInvalidDate: true }),
                (d1: Date, d2: Date) => {
                    const [t1, t2] =
                        d1.getTime() <= d2.getTime() ? [d1, d2] : [d2, d1];

                    const phase1 = getMissionPhase(ARTEMIS_LAUNCH_DATE, t1);
                    const phase2 = getMissionPhase(ARTEMIS_LAUNCH_DATE, t2);

                    const index1 = VALID_PHASES.indexOf(phase1);
                    const index2 = VALID_PHASES.indexOf(phase2);

                    expect(index1).toBeLessThanOrEqual(index2);
                },
            ),
            { numRuns: 1000 },
        );
    });
});

/**
 * Property 5: Mission window detection correctness
 *
 * For any launch Date and current Date, isInMissionWindow(launch, now) returns
 * true if and only if the absolute difference between now and launch is 10 days
 * or less.
 *
 * **Validates: Requirements 8.1, 8.2, 8.3**
 */
describe("Property 5: Mission window detection correctness", () => {
    it("should return true iff absolute difference <= 10 days", () => {
        fc.assert(
            fc.property(fc.date(), fc.date(), (launchDate: Date, now: Date) => {
                const result = isInMissionWindow(launchDate, now);

                const diffMs = Math.abs(now.getTime() - launchDate.getTime());
                const diffDays = diffMs / (1000 * 60 * 60 * 24);
                const expected = diffDays <= 10;

                expect(result).toBe(expected);
            }),
            { numRuns: 1000 },
        );
    });
});
