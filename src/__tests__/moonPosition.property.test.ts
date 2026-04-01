import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { getMoonPosition } from "../utils/moonPosition";

/**
 * Property 4: Moon position within physical bounds
 *
 * For any Date value, getMoonPosition(date) returns a MoonPosition where
 * latitude is in [-28.5, 28.5], longitude is in [-180, 180], and distance
 * is in [356000, 407000] km.
 *
 * **Validates: Requirements 6.2, 6.3, 6.4**
 */
describe("Property 4: Moon position within physical bounds", () => {
    it("should return lat in [-28.5, 28.5], lng in [-180, 180], distance in [356000, 407000] for any Date", () => {
        fc.assert(
            fc.property(fc.date({ noInvalidDate: true }), (date: Date) => {
                const pos = getMoonPosition(date);

                // Latitude must be within Moon's orbital inclination bounds
                expect(pos.lat).toBeGreaterThanOrEqual(-28.5);
                expect(pos.lat).toBeLessThanOrEqual(28.5);

                // Longitude must be within valid geographic range
                expect(pos.lng).toBeGreaterThanOrEqual(-180);
                expect(pos.lng).toBeLessThanOrEqual(180);

                // Distance must be within perigee-apogee range
                expect(pos.distance).toBeGreaterThanOrEqual(356000);
                expect(pos.distance).toBeLessThanOrEqual(407000);
            }),
            { numRuns: 1000 },
        );
    });
});
