import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ARTEMIS_CREW,
    ARTEMIS_LAUNCH_DATE,
    MISSION_STATS,
} from "@/data/artemisData";
import { getPastLaunches, getUpcomingLaunches } from "@/services/launchApi";
import type { Launch } from "@/types";
import {
    AlertCircle,
    Calendar,
    Clock,
    Loader2,
    MapPin,
    Rocket,
    Star,
} from "lucide-react";
import { useEffect, useState } from "react";

const ARTEMIS_II_LAUNCH: Launch = {
    id: "artemis-ii",
    name: "SLS Block 1 | Artemis II",
    status: {
        id: 3,
        name: "Launch Successful",
        abbrev: "Success",
        description: "Launched successfully on April 1, 2026",
    },
    net: ARTEMIS_LAUNCH_DATE.toISOString(),
    window_start: ARTEMIS_LAUNCH_DATE.toISOString(),
    window_end: new Date(
        ARTEMIS_LAUNCH_DATE.getTime() + 2 * 60 * 60 * 1000,
    ).toISOString(),
    mission: {
        id: 9999,
        name: "Artemis II",
        description: `First crewed Artemis mission: a ${MISSION_STATS.duration} lunar flyby carrying ${ARTEMIS_CREW.length} astronauts ${MISSION_STATS.distanceBeyondMoon} beyond the Moon and back, covering ${MISSION_STATS.totalDistance} at up to ${MISSION_STATS.reentrySpeed} on reentry.`,
        type: "Human Exploration",
        orbit: { id: 100, name: "Lunar Flyby", abbrev: "Lunar" },
    },
    pad: {
        id: 87,
        name: "Launch Complex 39B",
        location: {
            id: 27,
            name: "Kennedy Space Center, FL, USA",
            country_code: "USA",
        },
        latitude: "28.6272",
        longitude: "-80.6208",
        total_launch_count: 57,
    },
    rocket: {
        id: 9000,
        configuration: {
            id: 9001,
            name: "SLS Block 1",
            full_name: "Space Launch System Block 1",
            family: "SLS",
            variant: "Block 1",
        },
    },
    launch_service_provider: {
        id: 44,
        name: "National Aeronautics and Space Administration",
        abbrev: "NASA",
        type: "Government",
        country_code: "USA",
    },
    webcast_live: true,
};

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
    });
}

function getStatusColor(abbrev: string): string {
    switch (abbrev) {
        case "Go":
            return "bg-green-500/10 text-green-500 border-green-500/20";
        case "Success":
            return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
        case "TBD":
            return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
        case "TBC":
            return "bg-orange-500/10 text-orange-500 border-orange-500/20";
        default:
            return "bg-muted text-muted-foreground";
    }
}

function LaunchCard({
    launch,
    featured = false,
}: {
    launch: Launch;
    featured?: boolean;
}) {
    return (
        <div
            className={`p-4 rounded-lg border transition-colors ${featured ? "border-primary/40 bg-primary/5" : "hover:bg-muted/50"}`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    {featured && (
                        <Star className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                        <p className="font-medium truncate">{launch.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {launch.launch_service_provider.name}
                        </p>
                    </div>
                </div>
                <Badge
                    variant="outline"
                    className={`shrink-0 ${getStatusColor(launch.status.abbrev)}`}
                >
                    {launch.status.abbrev}
                </Badge>
            </div>
            {launch.mission && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {launch.mission.description}
                </p>
            )}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(launch.net)}
                </span>
                <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {launch.pad.location.name}
                </span>
                {launch.mission?.orbit && (
                    <span className="flex items-center gap-1">
                        <Rocket className="h-3 w-3" />
                        {launch.mission.orbit.name}
                    </span>
                )}
            </div>
        </div>
    );
}

export function LaunchDashboard() {
    const [upcomingLaunches, setUpcomingLaunches] = useState<Launch[]>([]);
    const [pastLaunches, setPastLaunches] = useState<Launch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function loadLaunches() {
            setLoading(true);
            setError(null);
            try {
                const [upcoming, past] = await Promise.all([
                    getUpcomingLaunches(),
                    getPastLaunches(),
                ]);
                if (!cancelled) {
                    const filteredUpcoming = upcoming.filter(
                        (l) =>
                            l.id !== ARTEMIS_II_LAUNCH.id &&
                            !l.name.toLowerCase().includes("artemis ii"),
                    );
                    setUpcomingLaunches(filteredUpcoming);
                    const filteredPast = past.filter(
                        (l) =>
                            l.id !== ARTEMIS_II_LAUNCH.id &&
                            !l.name.toLowerCase().includes("artemis ii"),
                    );
                    setPastLaunches([ARTEMIS_II_LAUNCH, ...filteredPast]);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load launch data",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadLaunches();
        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                    Loading launch data from Launch Library 2...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive font-medium">
                    Unable to load launch data
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {upcomingLaunches.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Upcoming
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-emerald-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {pastLaunches.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Recent
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Star className="h-5 w-5 text-yellow-500" />
                            <div>
                                <p className="text-2xl font-bold">Artemis II</p>
                                <p className="text-xs text-muted-foreground">
                                    Featured
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {
                                        upcomingLaunches.filter(
                                            (l) => l.status.abbrev === "Go",
                                        ).length
                                    }
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Go for Launch
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="upcoming">
                <TabsList>
                    <TabsTrigger value="upcoming">
                        Upcoming ({upcomingLaunches.length})
                    </TabsTrigger>
                    <TabsTrigger value="past">
                        Recent ({pastLaunches.length})
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="upcoming">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Upcoming Launches
                            </CardTitle>
                            <CardDescription>
                                Real-time launch schedule from Launch Library 2
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px]">
                                <div className="space-y-2">
                                    {upcomingLaunches.map((launch, idx) => (
                                        <div key={launch.id}>
                                            <LaunchCard
                                                launch={launch}
                                                featured={idx === 0}
                                            />
                                            {idx === 0 && (
                                                <Separator className="my-3" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="past">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Recent Launches
                            </CardTitle>
                            <CardDescription>
                                Past launch results from Launch Library 2
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[600px]">
                                <div className="space-y-2">
                                    {pastLaunches.map((launch) => (
                                        <LaunchCard
                                            key={launch.id}
                                            launch={launch}
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
