import type { Launch, PaginatedResponse } from "@/types";
import { fetchWithCache } from "@/utils/cacheUtils";

const BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

async function fetchAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
        if (response.status === 429) {
            throw new Error(
                "API rate limit reached. The free tier allows ~15 requests/hour. Cached data will be used if available, otherwise please wait a few minutes.",
            );
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

export async function getUpcomingLaunches(limit = 20): Promise<Launch[]> {
    const data = await fetchWithCache<PaginatedResponse<Launch>>(
        `ll2-upcoming-${limit}`,
        () =>
            fetchAPI<PaginatedResponse<Launch>>(
                `/launch/upcoming/?limit=${limit}&format=json`,
            ),
        THIRTY_MINUTES_MS,
    );
    return data.results;
}

export async function getPastLaunches(limit = 20): Promise<Launch[]> {
    const data = await fetchWithCache<PaginatedResponse<Launch>>(
        `ll2-past-${limit}`,
        () =>
            fetchAPI<PaginatedResponse<Launch>>(
                `/launch/previous/?limit=${limit}&format=json`,
            ),
        THIRTY_MINUTES_MS,
    );
    return data.results;
}

export async function getLaunchById(id: string): Promise<Launch> {
    return fetchAPI<Launch>(`/launch/${id}/`);
}

export async function searchLaunches(query: string): Promise<Launch[]> {
    const data = await fetchAPI<PaginatedResponse<Launch>>(
        `/launch/?search=${encodeURIComponent(query)}&mode=detailed`,
    );
    return data.results;
}

export async function getLaunchesByProvider(
    providerId: number,
    limit = 20,
): Promise<Launch[]> {
    const data = await fetchAPI<PaginatedResponse<Launch>>(
        `/launch/?launch_service_provider__id=${providerId}&limit=${limit}&mode=detailed`,
    );
    return data.results;
}

export async function getAllLaunchesForYear(year: number): Promise<Launch[]> {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    const data = await fetchAPI<PaginatedResponse<Launch>>(
        `/launch/?net__gte=${startDate}&net__lte=${endDate}&limit=100&mode=list`,
    );
    return data.results;
}
