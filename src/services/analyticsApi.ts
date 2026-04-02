import type { Launch, PaginatedResponse } from "@/types";
import { fetchWithCache } from "@/utils/cacheUtils";

const BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

async function fetchAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
        if (response.status === 429) {
            throw new Error(
                "API rate limit reached. Please wait a few minutes.",
            );
        }
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

/**
 * Fetch all launches for a year by splitting into H1/H2 halves
 * to stay within the 200-result API limit per request.
 */
async function fetchLaunchesForYear(year: number): Promise<Launch[]> {
    const h1 = await fetchWithCache<PaginatedResponse<Launch>>(
        `ll2-analytics-${year}-h1`,
        () =>
            fetchAPI<PaginatedResponse<Launch>>(
                `/launch/?net__gte=${year}-01-01&net__lte=${year}-06-30&limit=200&format=json`,
            ),
        ONE_DAY_MS,
    );
    const h2 = await fetchWithCache<PaginatedResponse<Launch>>(
        `ll2-analytics-${year}-h2`,
        () =>
            fetchAPI<PaginatedResponse<Launch>>(
                `/launch/?net__gte=${year}-07-01&net__lte=${year}-12-31&limit=200&format=json`,
            ),
        ONE_DAY_MS,
    );
    return [...h1.results, ...h2.results];
}

export interface ProviderStats {
    name: string;
    count: number;
    successRate: number;
}

export interface YearStats {
    year: string;
    total: number;
    success: number;
}

export interface MonthlyStats {
    month: string;
    launches: number;
    spacex: number;
    others: number;
}

export interface AnalyticsData {
    launchesByProvider: ProviderStats[];
    launchesByYear: YearStats[];
    monthlyLaunches: MonthlyStats[];
    totalLaunches: number;
    overallSuccessRate: number;
    growthPercent: number;
    yearRange: string;
    latestFullYear: number;
}

const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
];

/**
 * Fetch and compute analytics from real Launch Library 2 data.
 * The entire computed result is cached for 24 hours to avoid rate limits.
 */
export async function getAnalyticsData(): Promise<AnalyticsData> {
    return fetchWithCache<AnalyticsData>(
        "ll2-analytics-computed",
        computeAnalytics,
        ONE_DAY_MS,
    );
}

async function computeAnalytics(): Promise<AnalyticsData> {
    const currentYear = new Date().getFullYear();
    const endYear = currentYear - 1; // last full year (2025)
    const startYear = 2019;
    const years = Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i,
    );

    // Fetch all years — each year does 2 requests (H1 + H2)
    const allYearLaunches = await Promise.all(
        years.map((y) => fetchLaunchesForYear(y)),
    );

    const allLaunches = allYearLaunches.flat();

    // --- Launches by year ---
    const launchesByYear: YearStats[] = years.map((year, i) => {
        const launches = allYearLaunches[i];
        const success = launches.filter(
            (l) => l.status?.abbrev === "Success",
        ).length;
        return { year: String(year), total: launches.length, success };
    });

    // --- Launches by provider (for the latest full year) ---
    const latestYearLaunches = allYearLaunches[allYearLaunches.length - 1];
    const providerMap = new Map<string, { total: number; success: number }>();
    for (const l of latestYearLaunches) {
        const name = l.launch_service_provider?.name ?? "Unknown";
        const shortName = normalizeProviderName(name);
        const entry = providerMap.get(shortName) ?? { total: 0, success: 0 };
        entry.total++;
        if (l.status?.abbrev === "Success") entry.success++;
        providerMap.set(shortName, entry);
    }
    const launchesByProvider: ProviderStats[] = Array.from(
        providerMap.entries(),
    )
        .map(([name, { total, success }]) => ({
            name,
            count: total,
            successRate: total > 0 ? Math.round((success / total) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    // --- Monthly breakdown for latest full year ---
    const monthlyLaunches: MonthlyStats[] = MONTH_NAMES.map((month, i) => {
        const monthLaunches = latestYearLaunches.filter((l) => {
            const d = new Date(l.net);
            return d.getMonth() === i;
        });
        const spacex = monthLaunches.filter((l) =>
            l.launch_service_provider?.name?.toLowerCase().includes("spacex"),
        ).length;
        return {
            month,
            launches: monthLaunches.length,
            spacex,
            others: monthLaunches.length - spacex,
        };
    });

    // --- Totals ---
    const totalLaunches = allLaunches.length;
    const totalSuccess = allLaunches.filter(
        (l) => l.status?.abbrev === "Success",
    ).length;
    const overallSuccessRate =
        totalLaunches > 0
            ? Math.round((totalSuccess / totalLaunches) * 1000) / 10
            : 0;

    // --- Growth ---
    const firstYearCount = allYearLaunches[0].length;
    const lastYearCount = latestYearLaunches.length;
    const growthPercent =
        firstYearCount > 0
            ? Math.round(
                  ((lastYearCount - firstYearCount) / firstYearCount) * 100,
              )
            : 0;

    return {
        launchesByProvider,
        launchesByYear,
        monthlyLaunches,
        totalLaunches,
        overallSuccessRate,
        growthPercent,
        yearRange: `${startYear}-${endYear}`,
        latestFullYear: endYear,
    };
}

function normalizeProviderName(name: string): string {
    const map: Record<string, string> = {
        spacex: "SpaceX",
        "rocket lab": "Rocket Lab",
        "united launch alliance": "ULA",
        arianespace: "Arianespace",
        "indian space research organization": "ISRO",
        "china aerospace science and technology corporation": "CASC",
        "russian federal space agency": "Roscosmos",
        roscosmos: "Roscosmos",
        "northrop grumman": "Northrop Grumman",
        "blue origin": "Blue Origin",
        "mitsubishi heavy industries": "MHI",
        "china aerospace science and industry corporation": "CASIC",
        "galactic energy": "Galactic Energy",
        landspace: "LandSpace",
        ispace: "iSpace",
        expace: "ExPace",
        "firefly aerospace": "Firefly",
    };
    const lower = name.toLowerCase();
    for (const [key, val] of Object.entries(map)) {
        if (lower.includes(key)) return val;
    }
    return name.length > 20 ? name.split(" ").slice(0, 2).join(" ") : name;
}
