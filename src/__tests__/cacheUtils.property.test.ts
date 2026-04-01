import * as fc from "fast-check";
import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWithCache } from "../utils/cacheUtils";

// In-memory localStorage mock using Map to avoid __proto__ issues
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

afterEach(() => {
    store = new Map<string, string>();
});

/**
 * Property 6: Cache hit avoids fetcher call
 *
 * If a valid (non-expired) cache entry exists, cached data is returned
 * and fetcher is not invoked.
 *
 * **Validates: Requirement 13.1**
 */
describe("Property 6: Cache hit avoids fetcher call", () => {
    it("should return cached data and not invoke fetcher when cache is valid", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1 }),
                fc.jsonValue(),
                fc.integer({ min: 1000, max: 86_400_000 }),
                async (key: string, data: unknown, ttlMs: number) => {
                    // Clear store between iterations
                    store.clear();

                    // Seed the cache with a fresh entry
                    const entry = {
                        data,
                        timestamp: Date.now(),
                        ttl: ttlMs,
                    };
                    store.set(key, JSON.stringify(entry));

                    const fetcher = vi
                        .fn()
                        .mockResolvedValue("should not be called");

                    const result = await fetchWithCache(key, fetcher, ttlMs);

                    // Cached data is returned
                    expect(result).toEqual(data);
                    // Fetcher was never invoked
                    expect(fetcher).not.toHaveBeenCalled();
                },
            ),
            { numRuns: 100 },
        );
    });
});

/**
 * Property 7: Stale cache fallback on fetch failure
 *
 * If fetcher fails and stale cache exists, stale data is returned
 * instead of error.
 *
 * **Validates: Requirements 13.3, 10.2**
 */
describe("Property 7: Stale cache fallback on fetch failure", () => {
    it("should return stale cached data when fetcher fails and stale cache exists", async () => {
        await fc.assert(
            fc.asyncProperty(
                fc.string({ minLength: 1 }),
                fc.jsonValue(),
                fc.integer({ min: 1000, max: 86_400_000 }),
                async (key: string, data: unknown, ttlMs: number) => {
                    // Clear store between iterations
                    store.clear();

                    // Seed the cache with an expired (stale) entry
                    const entry = {
                        data,
                        timestamp: Date.now() - ttlMs - 1,
                        ttl: ttlMs,
                    };
                    store.set(key, JSON.stringify(entry));

                    const fetcher = vi
                        .fn()
                        .mockRejectedValue(new Error("network failure"));

                    const result = await fetchWithCache(key, fetcher, ttlMs);

                    // Stale cached data is returned
                    expect(result).toEqual(data);
                    // Fetcher was called (because cache was expired)
                    expect(fetcher).toHaveBeenCalledOnce();
                },
            ),
            { numRuns: 100 },
        );
    });
});
