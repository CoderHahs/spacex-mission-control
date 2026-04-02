import type { Launch, PaginatedResponse } from "@/types";
import { fetchWithCache } from "@/utils/cacheUtils";

const BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

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
    try {
        const data = await fetchWithCache<PaginatedResponse<Launch>>(
            `ll2-upcoming-${limit}`,
            () =>
                fetchAPI<PaginatedResponse<Launch>>(
                    `/launch/upcoming/?limit=${limit}&format=json`,
                ),
            ONE_DAY_MS,
        );
        return data.results;
    } catch {
        return getMockUpcomingLaunches();
    }
}

export async function getPastLaunches(limit = 20): Promise<Launch[]> {
    try {
        const data = await fetchWithCache<PaginatedResponse<Launch>>(
            `ll2-past-${limit}`,
            () =>
                fetchAPI<PaginatedResponse<Launch>>(
                    `/launch/previous/?limit=${limit}&format=json`,
                ),
            ONE_DAY_MS,
        );
        return data.results;
    } catch {
        return getMockPastLaunches();
    }
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

// ── Mock fallback data (real launches as of April 2, 2026) ──

function makeLaunch(
    id: string,
    name: string,
    abbrev: string,
    net: string,
    missionName: string,
    desc: string,
    type: string,
    orbitName: string,
    orbitAbbrev: string,
    padName: string,
    locName: string,
    cc: string,
    lat: string,
    lng: string,
    rocketName: string,
    rocketFull: string,
    family: string,
    lspName: string,
    lspAbbrev: string,
    lspType: string,
    lspCC: string,
): Launch {
    return {
        id,
        name,
        status: {
            id: abbrev === "Success" ? 3 : abbrev === "Go" ? 1 : 2,
            name:
                abbrev === "Success"
                    ? "Launch Successful"
                    : abbrev === "Go"
                      ? "Go for Launch"
                      : "TBD",
            abbrev,
            description: "",
        },
        net,
        window_start: net,
        window_end: net,
        mission: {
            id: Number(id),
            name: missionName,
            description: desc,
            type,
            orbit: { id: 1, name: orbitName, abbrev: orbitAbbrev },
        },
        pad: {
            id: 1,
            name: padName,
            location: { id: 1, name: locName, country_code: cc },
            latitude: lat,
            longitude: lng,
            total_launch_count: 0,
        },
        rocket: {
            id: 1,
            configuration: {
                id: 1,
                name: rocketName,
                full_name: rocketFull,
                family,
            },
        },
        launch_service_provider: {
            id: 1,
            name: lspName,
            abbrev: lspAbbrev,
            type: lspType,
            country_code: lspCC,
        },
        webcast_live: false,
    };
}

function getMockUpcomingLaunches(): Launch[] {
    return [
        makeLaunch(
            "u1",
            "Tianlong-3 | Demo Flight",
            "Go",
            "2026-04-03T04:00:00Z",
            "Demo Flight",
            "Maiden flight of Space Pioneer's Tianlong-3 rocket, potentially carrying Qianfan LEO communication satellites.",
            "Test Flight",
            "Polar Orbit",
            "Polar",
            "Jiuquan SLC",
            "Jiuquan, China",
            "CHN",
            "40.96",
            "100.29",
            "Tianlong-3",
            "Tianlong-3",
            "Tianlong",
            "Space Pioneer",
            "SP",
            "Commercial",
            "CHN",
        ),
        makeLaunch(
            "u2",
            "Atlas V 551 | Amazon Leo LA-05",
            "Go",
            "2026-04-04T05:45:00Z",
            "Amazon Leo LA-05",
            "Sixth Amazon Leo launch on Atlas V, deploying 29 broadband internet satellites.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "SLC-41",
            "Cape Canaveral SFS, FL, USA",
            "USA",
            "28.58",
            "-80.58",
            "Atlas V",
            "Atlas V 551",
            "Atlas",
            "United Launch Alliance",
            "ULA",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "u3",
            "Falcon 9 Block 5 | Starlink Group 17-35",
            "Go",
            "2026-04-04T23:03:00Z",
            "Starlink Group 17-35",
            "A batch of 25 Starlink satellites launched from Vandenberg.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "SLC-4E",
            "Vandenberg SFB, CA, USA",
            "USA",
            "34.63",
            "-120.61",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "u4",
            "Long March 8 | Qianfan Batch",
            "TBD",
            "2026-04-07T13:00:00Z",
            "Qianfan Batch",
            "Deployment of Qianfan broadband internet satellites to polar LEO.",
            "Communications",
            "Polar Orbit",
            "Polar",
            "Wenchang Commercial LC-1",
            "Wenchang, China",
            "CHN",
            "19.61",
            "110.95",
            "Long March 8",
            "Long March 8",
            "Long March",
            "CASC",
            "CASC",
            "Government",
            "CHN",
        ),
        makeLaunch(
            "u5",
            "Falcon 9 Block 5 | Cygnus NG-24",
            "Go",
            "2026-04-08T12:51:00Z",
            "Cygnus NG-24",
            "ISS resupply mission. Last of four Cygnus spacecraft launched via Falcon 9.",
            "Resupply",
            "Low Earth Orbit",
            "LEO",
            "SLC-40",
            "Cape Canaveral SFS, FL, USA",
            "USA",
            "28.56",
            "-80.58",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "u6",
            "Vega-C | SMILE",
            "Go",
            "2026-04-09T06:29:00Z",
            "SMILE",
            "Solar wind Magnetosphere Ionosphere Link Explorer — joint ESA/CAS mission.",
            "Earth Science",
            "Highly Elliptical Orbit",
            "HEO",
            "ELV",
            "Guiana Space Centre",
            "GUF",
            "5.24",
            "-52.77",
            "Vega-C",
            "Vega-C",
            "Vega",
            "Avio",
            "Avio",
            "Commercial",
            "ITA",
        ),
        makeLaunch(
            "u7",
            "New Glenn | BlueBird 7",
            "TBD",
            "2026-04-10T15:00:00Z",
            "BlueBird 7",
            "AST SpaceMobile BlueBird Block 2 satellite. Third New Glenn flight, first with reused booster.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "LC-36",
            "Cape Canaveral SFS, FL, USA",
            "USA",
            "28.47",
            "-80.54",
            "New Glenn",
            "New Glenn",
            "New Glenn",
            "Blue Origin",
            "BO",
            "Commercial",
            "USA",
        ),
    ];
}

function getMockPastLaunches(): Launch[] {
    return [
        makeLaunch(
            "p1",
            "SLS Block 1 | Artemis II",
            "Success",
            "2026-04-01T22:35:12Z",
            "Artemis II",
            "First crewed Artemis mission: 10-day lunar flyby with 4 astronauts.",
            "Human Exploration",
            "Lunar Flyby",
            "Lunar",
            "LC-39B",
            "Kennedy Space Center, FL, USA",
            "USA",
            "28.63",
            "-80.62",
            "SLS Block 1",
            "Space Launch System Block 1",
            "SLS",
            "NASA",
            "NASA",
            "Government",
            "USA",
        ),
        makeLaunch(
            "p2",
            "Falcon 9 Block 5 | Starlink Group 10-58",
            "Success",
            "2026-04-02T11:55:10Z",
            "Starlink Group 10-58",
            "A batch of 29 Starlink satellites deployed to LEO.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "SLC-40",
            "Cape Canaveral SFS, FL, USA",
            "USA",
            "28.56",
            "-80.58",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "p3",
            "Falcon 9 Block 5 | Starlink Group 10-57",
            "Success",
            "2026-03-30T14:22:00Z",
            "Starlink Group 10-57",
            "A batch of 29 Starlink v2 Mini satellites deployed to LEO.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "SLC-40",
            "Cape Canaveral SFS, FL, USA",
            "USA",
            "28.56",
            "-80.58",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "p4",
            "Falcon 9 Block 5 | Starlink Group 17-17",
            "Success",
            "2026-03-26T23:03:19Z",
            "Starlink Group 17-17",
            "A batch of 25 Starlink satellites launched from Vandenberg.",
            "Communications",
            "Low Earth Orbit",
            "LEO",
            "SLC-4E",
            "Vandenberg SFB, CA, USA",
            "USA",
            "34.63",
            "-120.61",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
        makeLaunch(
            "p5",
            "SpaceX Crew-12 | Dragon Endeavour",
            "Success",
            "2026-02-13T16:30:00Z",
            "SpaceX Crew-12",
            "Crew rotation to ISS: Meir, Hathaway (NASA), Adenot (ESA), Fedyaev (Roscosmos).",
            "Human Exploration",
            "Low Earth Orbit",
            "LEO",
            "LC-39A",
            "Kennedy Space Center, FL, USA",
            "USA",
            "28.61",
            "-80.60",
            "Falcon 9",
            "Falcon 9 Block 5",
            "Falcon",
            "SpaceX",
            "SpX",
            "Commercial",
            "USA",
        ),
    ];
}
