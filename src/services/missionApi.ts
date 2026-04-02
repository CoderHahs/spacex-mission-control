import type { SpaceMission } from "@/types";

// Real mission data as of April 2026
export function getMockMissions(): SpaceMission[] {
    return [
        {
            id: "artemis-2",
            name: "Artemis II",
            description:
                "First crewed Artemis mission, launched April 1, 2026. Four astronauts are flying around the Moon on a 10-day free-return trajectory aboard the Orion spacecraft, the farthest humans have traveled from Earth since Apollo 17 in 1972.",
            status: "in-progress",
            type: "crewed",
            startDate: "2026-04-01",
            endDate: "2026-04-11",
            agency: "NASA",
            crew: [
                {
                    id: "c1",
                    name: "Reid Wiseman",
                    role: "Commander",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "c2",
                    name: "Victor Glover",
                    role: "Pilot",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "c3",
                    name: "Christina Koch",
                    role: "Mission Specialist",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "c4",
                    name: "Jeremy Hansen",
                    role: "Mission Specialist",
                    agency: "CSA",
                    nationality: "Canada",
                },
            ],
            objectives: [
                "First crewed Orion flight beyond Low Earth Orbit",
                "Test life support systems with crew",
                "Demonstrate SLS and Orion systems",
                "Verify trajectory and communications",
            ],
            progress: 15,
        },
        {
            id: "exp-74",
            name: "Expedition 74",
            description:
                "Long-duration mission aboard the International Space Station. Crew-12 arrived in February 2026, joining the existing crew for science research, station maintenance, and spacewalks.",
            status: "in-progress",
            type: "crewed",
            startDate: "2025-12-09",
            endDate: "2026-07-26",
            agency: "NASA/Roscosmos/ESA",
            crew: [
                {
                    id: "e1",
                    name: "Michael Fincke",
                    role: "Commander",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "e2",
                    name: "Chris Williams",
                    role: "Flight Engineer",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "e3",
                    name: "Sergey Kud-Sverchkov",
                    role: "Flight Engineer",
                    agency: "Roscosmos",
                    nationality: "Russia",
                },
                {
                    id: "e4",
                    name: "Sergei Mikayev",
                    role: "Flight Engineer",
                    agency: "Roscosmos",
                    nationality: "Russia",
                },
                {
                    id: "e5",
                    name: "Jessica Meir",
                    role: "Flight Engineer",
                    agency: "NASA",
                    nationality: "USA",
                },
                {
                    id: "e6",
                    name: "Sophie Adenot",
                    role: "Flight Engineer",
                    agency: "ESA",
                    nationality: "France",
                },
                {
                    id: "e7",
                    name: "Andrey Fedyaev",
                    role: "Flight Engineer",
                    agency: "Roscosmos",
                    nationality: "Russia",
                },
            ],
            objectives: [
                "Conduct microgravity research experiments",
                "Maintain station systems and perform spacewalks",
                "Support commercial crew operations",
                "Prepare for ISS end-of-life transition planning",
            ],
            progress: 55,
        },
        {
            id: "europa-clipper",
            name: "Europa Clipper",
            description:
                "NASA mission to study Jupiter's icy moon Europa. Launched October 14, 2024, it completed a Mars gravity assist in March 2025 and is en route for an Earth gravity assist in December 2026 before arriving at Europa in April 2030.",
            status: "in-progress",
            type: "robotic",
            startDate: "2024-10-14",
            endDate: "2030-04-01",
            agency: "NASA",
            objectives: [
                "Characterize Europa's ice shell and subsurface ocean",
                "Map surface composition and geology",
                "Search for signs of habitability",
                "Select landing sites for future missions",
            ],
            progress: 20,
        },
        {
            id: "psyche",
            name: "Psyche",
            description:
                "NASA mission to explore asteroid 16 Psyche, a metal-rich body thought to be the exposed core of an early planet. Launched October 13, 2023, it is performing a Mars flyby in May 2026 before arriving at the asteroid in August 2029.",
            status: "in-progress",
            type: "robotic",
            startDate: "2023-10-13",
            endDate: "2031-10-31",
            agency: "NASA",
            objectives: [
                "Determine if Psyche is a planetary core",
                "Map surface elemental composition",
                "Characterize topography and gravity field",
                "Test deep space optical communications (DSOC)",
            ],
            progress: 30,
        },
        {
            id: "juice",
            name: "JUICE",
            description:
                "ESA's Jupiter Icy Moons Explorer, launched April 14, 2023. Currently in its cruise phase with gravity assists, JUICE will arrive at Jupiter in July 2031 to study Ganymede, Callisto, and Europa.",
            status: "in-progress",
            type: "robotic",
            startDate: "2023-04-14",
            endDate: "2035-09-01",
            agency: "ESA",
            objectives: [
                "Study Jupiter's atmosphere and magnetosphere",
                "Characterize Ganymede as a planetary body and potential habitat",
                "Explore Europa and Callisto's subsurface oceans",
                "Investigate conditions for planet formation around gas giants",
            ],
            progress: 25,
        },
        {
            id: "artemis-3",
            name: "Artemis III",
            description:
                "Planned crewed mission to test rendezvous and docking with commercial landers in low Earth orbit. Originally intended as a lunar landing, it was restructured in February 2026 to focus on LEO systems testing. Launch targeted for mid-2027.",
            status: "planned",
            type: "crewed",
            startDate: "2027-06-01",
            agency: "NASA",
            objectives: [
                "Test rendezvous and docking with commercial landers",
                "Validate crew transfer procedures in LEO",
                "Demonstrate Orion and lander integration",
                "Prepare systems for Artemis IV lunar landing",
            ],
            progress: 45,
        },
        {
            id: "artemis-4",
            name: "Artemis IV",
            description:
                "Planned first crewed lunar landing of the Artemis program. Will use SpaceX Starship or Blue Origin lander to return astronauts to the lunar surface for the first time since 1972. Targeted for 2028.",
            status: "planned",
            type: "crewed",
            startDate: "2028-06-01",
            agency: "NASA",
            objectives: [
                "Land astronauts on the lunar surface",
                "Conduct surface science experiments",
                "Test lunar surface EVA systems",
                "Begin establishing infrastructure for sustained presence",
            ],
            progress: 25,
        },
        {
            id: "dragonfly",
            name: "Dragonfly",
            description:
                "NASA mission to send a nuclear-powered rotorcraft lander to Saturn's moon Titan. Currently in integration and testing phase, with launch planned for July 2028 and arrival at Titan in 2034.",
            status: "planned",
            type: "robotic",
            startDate: "2028-07-01",
            agency: "NASA",
            objectives: [
                "Search for prebiotic chemical processes on Titan",
                "Investigate Titan's methane cycle",
                "Characterize habitability of Titan's environment",
                "Explore diverse surface locations across 70+ miles",
            ],
            progress: 40,
        },
        {
            id: "chandrayaan-4",
            name: "Chandrayaan-4",
            description:
                "ISRO's lunar sample return mission, building on the success of Chandrayaan-3. Will use modular architecture with separate propulsion, lander, ascender, and return modules to collect and return Moon samples to Earth.",
            status: "planned",
            type: "robotic",
            startDate: "2028-01-01",
            agency: "ISRO",
            objectives: [
                "Soft land on the lunar surface at Mons Mouton region",
                "Collect and store lunar surface samples",
                "Launch samples to lunar orbit via ascent vehicle",
                "Return samples safely to Earth",
            ],
            progress: 30,
        },
    ];
}

export function getMockMissionStats() {
    return {
        activeMissions: 5,
        plannedMissions: 4,
        completedMissions: 8,
        crewInSpace: 11,
        agencies: ["NASA", "ESA", "JAXA", "Roscosmos", "ISRO", "CSA", "CNSA"],
    };
}
