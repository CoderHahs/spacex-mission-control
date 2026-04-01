import type { Launch, PaginatedResponse } from "@/types";
import { fetchWithCache } from "@/utils/cacheUtils";

const BASE_URL = "https://ll.thespacedevs.com/2.2.0";
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

async function fetchAPI<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${endpoint}`);
    if (!response.ok) {
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
            THIRTY_MINUTES_MS,
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
            THIRTY_MINUTES_MS,
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

// Mock data for development/fallback
export function getMockUpcomingLaunches(): Launch[] {
    return [
        {
            id: "1",
            name: "Falcon 9 Block 5 | Starlink Group 6-45",
            status: {
                id: 1,
                name: "Go for Launch",
                abbrev: "Go",
                description: "Current T-0 confirmed",
            },
            net: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() + 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() + 2 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 1,
                name: "Starlink Group 6-45",
                description:
                    "A batch of 23 satellites for Starlink mega-constellation.",
                type: "Communications",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 80,
                name: "Space Launch Complex 40",
                location: {
                    id: 12,
                    name: "Cape Canaveral, FL, USA",
                    country_code: "USA",
                },
                latitude: "28.5618571",
                longitude: "-80.577366",
                total_launch_count: 238,
            },
            rocket: {
                id: 2816,
                configuration: {
                    id: 164,
                    name: "Falcon 9",
                    full_name: "Falcon 9 Block 5",
                    family: "Falcon",
                    variant: "Block 5",
                    image_url:
                        "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/falcon_9_block__image_20210506060831.jpg",
                },
            },
            launch_service_provider: {
                id: 121,
                name: "SpaceX",
                abbrev: "SpX",
                type: "Commercial",
                country_code: "USA",
                logo_url:
                    "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/spacex_logo_20220826094919.png",
            },
            image: "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/falcon_9_block__image_20210506060831.jpg",
            webcast_live: false,
        },
        {
            id: "2",
            name: "Electron | Synspective StriX",
            status: {
                id: 1,
                name: "Go for Launch",
                abbrev: "Go",
                description: "Current T-0 confirmed",
            },
            net: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() + 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() + 5 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 2,
                name: "Synspective StriX",
                description:
                    "Synthetic aperture radar satellite for Synspective.",
                type: "Earth Science",
                orbit: { id: 14, name: "Sun-Synchronous Orbit", abbrev: "SSO" },
            },
            pad: {
                id: 152,
                name: "Launch Complex 1B",
                location: {
                    id: 5,
                    name: "Rocket Lab LC-1",
                    country_code: "NZL",
                },
                latitude: "-39.262833",
                longitude: "177.864469",
                total_launch_count: 45,
            },
            rocket: {
                id: 7715,
                configuration: {
                    id: 160,
                    name: "Electron",
                    full_name: "Electron",
                    family: "Electron",
                    image_url:
                        "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/electron_image_20190705175640.jpg",
                },
            },
            launch_service_provider: {
                id: 147,
                name: "Rocket Lab",
                abbrev: "RocketLab",
                type: "Commercial",
                country_code: "USA",
                logo_url:
                    "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/rocket_lab_logo_20220218075411.png",
            },
            image: "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/electron_image_20190705175640.jpg",
            webcast_live: false,
        },
        {
            id: "3",
            name: "Soyuz 2.1a | Progress MS-26",
            status: {
                id: 2,
                name: "TBD",
                abbrev: "TBD",
                description: "Launch date pending",
            },
            net: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() + 10 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() + 10 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 3,
                name: "Progress MS-26",
                description:
                    "ISS resupply mission carrying food, fuel, and supplies.",
                type: "Resupply",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 32,
                name: "Site 31/6",
                location: {
                    id: 15,
                    name: "Baikonur Cosmodrome",
                    country_code: "KAZ",
                },
                latitude: "45.996034",
                longitude: "63.564003",
                total_launch_count: 406,
            },
            rocket: {
                id: 12,
                configuration: {
                    id: 24,
                    name: "Soyuz 2.1a",
                    full_name: "Soyuz 2.1a",
                    family: "Soyuz",
                    image_url:
                        "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/soyuz_2.1a_image_20190520082937.jpg",
                },
            },
            launch_service_provider: {
                id: 63,
                name: "Russian Federal Space Agency (Roscosmos)",
                abbrev: "RFSA",
                type: "Government",
                country_code: "RUS",
                logo_url:
                    "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/russian2520federa_image_20190207032459.png",
            },
            image: "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/soyuz_2.1a_image_20190520082937.jpg",
            webcast_live: false,
        },
        {
            id: "4",
            name: "Long March 5B | Tiangong Module",
            status: {
                id: 2,
                name: "TBD",
                abbrev: "TBD",
                description: "Launch date pending",
            },
            net: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() + 15 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() + 15 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 4,
                name: "Tiangong Module",
                description: "Chinese space station expansion module.",
                type: "Human Exploration",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 144,
                name: "Wenchang LC-1",
                location: {
                    id: 29,
                    name: "Wenchang Space Launch Site",
                    country_code: "CHN",
                },
                latitude: "19.614492",
                longitude: "110.951133",
                total_launch_count: 25,
            },
            rocket: {
                id: 500,
                configuration: {
                    id: 47,
                    name: "Long March 5B",
                    full_name: "Long March 5B",
                    family: "Long March 5",
                    image_url:
                        "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/long_march_5_ima_image_20190222031219.jpg",
                },
            },
            launch_service_provider: {
                id: 88,
                name: "China Aerospace Science and Technology Corporation",
                abbrev: "CASC",
                type: "Government",
                country_code: "CHN",
                logo_url:
                    "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/china_aerospace_s_image_20191118082522.png",
            },
            image: "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/long_march_5_ima_image_20190222031219.jpg",
            webcast_live: false,
        },
        {
            id: "5",
            name: "Ariane 6 | Demonstration Flight",
            status: {
                id: 1,
                name: "Go for Launch",
                abbrev: "Go",
                description: "Current T-0 confirmed",
            },
            net: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() + 20 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() + 20 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 5,
                name: "Ariane 6 Demo",
                description: "Inaugural flight of the Ariane 6 rocket.",
                type: "Test Flight",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 185,
                name: "ELA-4",
                location: {
                    id: 13,
                    name: "Guiana Space Centre",
                    country_code: "GUF",
                },
                latitude: "5.239",
                longitude: "-52.768",
                total_launch_count: 1,
            },
            rocket: {
                id: 600,
                configuration: {
                    id: 115,
                    name: "Ariane 6",
                    full_name: "Ariane 62",
                    family: "Ariane",
                    variant: "62",
                    image_url:
                        "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/ariane_6_image_20190207032507.jpeg",
                },
            },
            launch_service_provider: {
                id: 115,
                name: "Arianespace",
                abbrev: "ASA",
                type: "Commercial",
                country_code: "FRA",
                logo_url:
                    "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/arianespace_logo_20190207032425.png",
            },
            image: "https://spacelaunchnow-prod-east.nyc3.digitaloceanspaces.com/media/images/ariane_6_image_20190207032507.jpeg",
            webcast_live: false,
        },
    ];
}

export function getMockPastLaunches(): Launch[] {
    return [
        {
            id: "101",
            name: "Falcon 9 Block 5 | Starlink Group 6-44",
            status: {
                id: 3,
                name: "Launch Successful",
                abbrev: "Success",
                description: "Launch was successful",
            },
            net: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 101,
                name: "Starlink Group 6-44",
                description:
                    "A batch of 23 satellites for Starlink mega-constellation.",
                type: "Communications",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 80,
                name: "Space Launch Complex 40",
                location: {
                    id: 12,
                    name: "Cape Canaveral, FL, USA",
                    country_code: "USA",
                },
                latitude: "28.5618571",
                longitude: "-80.577366",
                total_launch_count: 238,
            },
            rocket: {
                id: 2816,
                configuration: {
                    id: 164,
                    name: "Falcon 9",
                    full_name: "Falcon 9 Block 5",
                    family: "Falcon",
                    variant: "Block 5",
                },
            },
            launch_service_provider: {
                id: 121,
                name: "SpaceX",
                abbrev: "SpX",
                type: "Commercial",
                country_code: "USA",
            },
            webcast_live: false,
        },
        {
            id: "102",
            name: "Atlas V 551 | NROL-107",
            status: {
                id: 3,
                name: "Launch Successful",
                abbrev: "Success",
                description: "Launch was successful",
            },
            net: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 102,
                name: "NROL-107",
                description:
                    "Classified payload for the National Reconnaissance Office.",
                type: "Government/Top Secret",
                orbit: { id: 8, name: "Low Earth Orbit", abbrev: "LEO" },
            },
            pad: {
                id: 29,
                name: "Space Launch Complex 41",
                location: {
                    id: 12,
                    name: "Cape Canaveral, FL, USA",
                    country_code: "USA",
                },
                latitude: "28.58341025",
                longitude: "-80.58303644",
                total_launch_count: 113,
            },
            rocket: {
                id: 3000,
                configuration: {
                    id: 166,
                    name: "Atlas V",
                    full_name: "Atlas V 551",
                    family: "Atlas",
                    variant: "551",
                },
            },
            launch_service_provider: {
                id: 124,
                name: "United Launch Alliance",
                abbrev: "ULA",
                type: "Commercial",
                country_code: "USA",
            },
            webcast_live: false,
        },
        {
            id: "103",
            name: "Falcon Heavy | Europa Clipper",
            status: {
                id: 3,
                name: "Launch Successful",
                abbrev: "Success",
                description: "Launch was successful",
            },
            net: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            window_start: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            window_end: new Date(
                Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
            ).toISOString(),
            mission: {
                id: 103,
                name: "Europa Clipper",
                description: "NASA mission to study Jupiter's moon Europa.",
                type: "Planetary Science",
                orbit: { id: 15, name: "Heliocentric N/A", abbrev: "Helio" },
            },
            pad: {
                id: 87,
                name: "Launch Complex 39A",
                location: {
                    id: 27,
                    name: "Kennedy Space Center, FL, USA",
                    country_code: "USA",
                },
                latitude: "28.60822681",
                longitude: "-80.60428186",
                total_launch_count: 160,
            },
            rocket: {
                id: 3100,
                configuration: {
                    id: 167,
                    name: "Falcon Heavy",
                    full_name: "Falcon Heavy",
                    family: "Falcon",
                },
            },
            launch_service_provider: {
                id: 121,
                name: "SpaceX",
                abbrev: "SpX",
                type: "Commercial",
                country_code: "USA",
            },
            webcast_live: false,
        },
    ];
}
