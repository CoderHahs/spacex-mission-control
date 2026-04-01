import * as fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Property 8: Satellite fallback never rejects
 *
 * For any satellite group string, `fetchTLEDataWithFallback(group)` resolves
 * successfully (never rejects), returning either real satellite data or mock
 * fallback data.
 *
 * **Validates: Requirement 10.4**
 */

// Mock localStorage for cacheUtils
let store = new Map<string, string>();
vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
        store.set(key, value);
    },
    removeItem: (key: string) => {
        store.delete(key);
    },
    clear: () => {
        store.clear();
    },
});

// Mock fetch globally so no real network calls are made
vi.stubGlobal(
    "fetch",
    vi.fn().mockRejectedValue(new Error("network unavailable")),
);

afterEach(() => {
    store.clear();
    vi.restoreAllMocks();
});

describe("Property 8: Satellite fallback never rejects", () => {
    it("should resolve successfully for any group string, returning real or mock data", async () => {
        // Import after mocks are set up
        const { fetchTLEDataWithFallback } =
            await import("../services/satelliteApi");

        await fc.assert(
            fc.asyncProperty(fc.string(), async (group: string) => {
                // Clear cache each iteration so fetchWithCache always calls fetcher
                store.clear();

                // The function must always resolve (never reject)
                const result = await fetchTLEDataWithFallback(group);

                // Result must be an array
                expect(Array.isArray(result)).toBe(true);

                // Every element must be a Satellite-shaped object
                for (const sat of result) {
                    expect(sat).toHaveProperty("id");
                    expect(sat).toHaveProperty("name");
                    expect(sat).toHaveProperty("noradId");
                    expect(sat).toHaveProperty("tle");
                    expect(sat).toHaveProperty("category");
                }
            }),
            { numRuns: 100 },
        );
    });
});
