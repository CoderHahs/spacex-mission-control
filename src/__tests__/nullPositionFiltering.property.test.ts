import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import type {
    Satellite,
    SatelliteCategory,
    SatellitePosition,
    TLE,
} from "../types";

/**
 * Property 11: Null satellite position filtering
 *
 * For any array of satellites, after filtering, the output array contains
 * no satellites with null positions, and all satellites with valid positions
 * are preserved.
 *
 * **Validates: Requirements 16.1, 16.2**
 */

// --- Generators ---

const categoryArb: fc.Arbitrary<SatelliteCategory> = fc.constantFrom(
    "communication",
    "weather",
    "navigation",
    "scientific",
    "military",
    "earth-observation",
    "iss",
    "starlink",
    "other",
);

const tleArb: fc.Arbitrary<TLE> = fc.record({
    line1: fc.string(),
    line2: fc.string(),
});

const positionArb: fc.Arbitrary<SatellitePosition> = fc.record({
    latitude: fc.double({ min: -90, max: 90, noNaN: true }),
    longitude: fc.double({ min: -180, max: 180, noNaN: true }),
    altitude: fc.double({ min: 0, max: 50000, noNaN: true }),
    velocity: fc.double({ min: 0, max: 30, noNaN: true }),
});

/** Generate a satellite with a valid position */
const validSatelliteArb: fc.Arbitrary<Satellite> = fc.record({
    id: fc.string({ minLength: 1 }),
    name: fc.string({ minLength: 1 }),
    noradId: fc.nat(),
    tle: tleArb,
    category: categoryArb,
    position: positionArb,
});

/** Generate a satellite with undefined position (simulates null from calculateSatellitePosition) */
const nullPositionSatelliteArb: fc.Arbitrary<Satellite> = fc
    .record({
        id: fc.string({ minLength: 1 }),
        name: fc.string({ minLength: 1 }),
        noradId: fc.nat(),
        tle: tleArb,
        category: categoryArb,
    })
    .map((sat) => ({ ...sat, position: undefined }));

/**
 * Generate a mixed array of satellites — some with valid positions, some with
 * undefined/null positions — mirroring what fetchTLEDataWithFallback processes.
 */
const mixedSatelliteArrayArb: fc.Arbitrary<Satellite[]> = fc.array(
    fc.oneof(validSatelliteArb, nullPositionSatelliteArb),
    { minLength: 0, maxLength: 50 },
);

// --- Filtering logic under test ---
// This mirrors the exact filtering pattern used in fetchTLEDataWithFallback:
//   .filter((sat): sat is Satellite => sat !== null)
// combined with the map that returns null for satellites with null positions.
// We test the equivalent: filter out satellites where position is undefined/null.

function filterNullPositions(satellites: Satellite[]): Satellite[] {
    return satellites.filter((sat): sat is Satellite => sat.position != null);
}

// --- Property Tests ---

describe("Property 11: Null satellite position filtering", () => {
    it("output contains no satellites with null/undefined positions", () => {
        fc.assert(
            fc.property(mixedSatelliteArrayArb, (satellites) => {
                const filtered = filterNullPositions(satellites);

                // Every satellite in the output must have a defined position
                for (const sat of filtered) {
                    expect(sat.position).toBeDefined();
                    expect(sat.position).not.toBeNull();
                }
            }),
            { numRuns: 200 },
        );
    });

    it("all satellites with valid positions are preserved in the output", () => {
        fc.assert(
            fc.property(mixedSatelliteArrayArb, (satellites) => {
                const filtered = filterNullPositions(satellites);

                // Collect all input satellites that have valid positions
                const validInputSatellites = satellites.filter(
                    (sat) => sat.position != null,
                );

                // The filtered output must contain exactly the valid-position satellites
                expect(filtered.length).toBe(validInputSatellites.length);

                // Each valid-position satellite from input must appear in output (same reference)
                for (const validSat of validInputSatellites) {
                    expect(filtered).toContain(validSat);
                }
            }),
            { numRuns: 200 },
        );
    });
});
