import type { CacheEntry } from "../types/index";

/**
 * Fetches data with localStorage caching and TTL validation.
 *
 * - On cache hit (non-expired): returns cached data without calling fetcher
 * - On cache miss or expired: calls fetcher, stores result with timestamp, returns data
 * - On fetcher failure with stale cache: returns stale data
 * - On fetcher failure with no cache: propagates error
 * - All localStorage operations wrapped in try-catch for quota/private-browsing resilience
 */
export async function fetchWithCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number,
): Promise<T> {
    let cached: string | null = null;

    try {
        cached = localStorage.getItem(key);
    } catch {
        // localStorage unavailable (private browsing, etc.)
    }

    if (cached) {
        try {
            const entry: CacheEntry<T> = JSON.parse(cached);
            if (Date.now() - entry.timestamp < ttlMs) {
                return entry.data;
            }
        } catch {
            // Corrupted cache entry — treat as cache miss
        }
    }

    try {
        const data = await fetcher();
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: ttlMs,
        };
        try {
            localStorage.setItem(key, JSON.stringify(entry));
        } catch {
            // localStorage full or unavailable — proceed without caching
        }
        return data;
    } catch (error) {
        if (cached) {
            try {
                const staleEntry: CacheEntry<T> = JSON.parse(cached);
                return staleEntry.data;
            } catch {
                // Corrupted stale cache — propagate original error
            }
        }
        throw error;
    }
}
