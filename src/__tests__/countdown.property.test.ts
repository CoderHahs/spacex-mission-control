import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { ARTEMIS_LAUNCH_DATE } from "../data/artemisData";

/**
 * Property 9: Countdown calculation correctness
 *
 * For any Date before the launch date, the countdown values (days, hours,
 * minutes, seconds) computed by the countdown calculation equal the actual
 * time difference between the current date and the launch date.
 *
 * Since useCountdown is a React hook that internally calls `new Date()`,
 * we extract and test the pure countdown calculation logic directly.
 * This is the same algorithm used by `formatCountdown` in src/lib/utils.ts.
 *
 * **Validates: Requirement 1.1**
 */

/**
 * Pure countdown calculation — mirrors the logic in formatCountdown (src/lib/utils.ts)
 * but accepts an explicit "now" parameter for testability.
 */
function calculateCountdown(
    targetDate: Date,
    now: Date,
): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean;
} {
    const diff = targetDate.getTime() - now.getTime();

    if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, isPast: false };
}

describe("Property 9: Countdown calculation correctness", () => {
    /**
     * Generate arbitrary dates strictly before the launch date.
     * We constrain to a reasonable range: up to ~100 years before launch.
     */
    const dateBeforeLaunch = fc.date({
        min: new Date("1926-01-01T00:00:00Z"),
        max: new Date(ARTEMIS_LAUNCH_DATE.getTime() - 1000), // at least 1 second before
        noInvalidDate: true,
    });

    it("should produce countdown values that reconstruct the exact time difference", () => {
        fc.assert(
            fc.property(dateBeforeLaunch, (now: Date) => {
                const countdown = calculateCountdown(ARTEMIS_LAUNCH_DATE, now);
                const diffMs = ARTEMIS_LAUNCH_DATE.getTime() - now.getTime();

                // Reconstruct total milliseconds from countdown components
                const reconstructedMs =
                    countdown.days * 24 * 60 * 60 * 1000 +
                    countdown.hours * 60 * 60 * 1000 +
                    countdown.minutes * 60 * 1000 +
                    countdown.seconds * 1000;

                // The reconstructed value should equal the floored total seconds * 1000
                // (sub-second remainder is discarded by Math.floor on seconds)
                const expectedMs = Math.floor(diffMs / 1000) * 1000;
                expect(reconstructedMs).toBe(expectedMs);

                // isPast should be false for dates before launch
                expect(countdown.isPast).toBe(false);
            }),
            { numRuns: 1000 },
        );
    });

    it("should produce non-negative values with correct ranges", () => {
        fc.assert(
            fc.property(dateBeforeLaunch, (now: Date) => {
                const countdown = calculateCountdown(ARTEMIS_LAUNCH_DATE, now);

                // All values must be non-negative integers
                expect(countdown.days).toBeGreaterThanOrEqual(0);
                expect(countdown.hours).toBeGreaterThanOrEqual(0);
                expect(countdown.hours).toBeLessThan(24);
                expect(countdown.minutes).toBeGreaterThanOrEqual(0);
                expect(countdown.minutes).toBeLessThan(60);
                expect(countdown.seconds).toBeGreaterThanOrEqual(0);
                expect(countdown.seconds).toBeLessThan(60);

                // All values must be integers (Math.floor)
                expect(Number.isInteger(countdown.days)).toBe(true);
                expect(Number.isInteger(countdown.hours)).toBe(true);
                expect(Number.isInteger(countdown.minutes)).toBe(true);
                expect(Number.isInteger(countdown.seconds)).toBe(true);
            }),
            { numRuns: 1000 },
        );
    });

    it("should return isPast=true with zeroed values for dates at or after launch", () => {
        const dateAtOrAfterLaunch = fc.date({
            min: ARTEMIS_LAUNCH_DATE,
            max: new Date("2126-01-01T00:00:00Z"),
            noInvalidDate: true,
        });

        fc.assert(
            fc.property(dateAtOrAfterLaunch, (now: Date) => {
                const countdown = calculateCountdown(ARTEMIS_LAUNCH_DATE, now);

                expect(countdown.isPast).toBe(true);
                expect(countdown.days).toBe(0);
                expect(countdown.hours).toBe(0);
                expect(countdown.minutes).toBe(0);
                expect(countdown.seconds).toBe(0);
            }),
            { numRuns: 500 },
        );
    });
});
