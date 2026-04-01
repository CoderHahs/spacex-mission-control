import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useSatellitePositions } from "@/hooks/useSatellitePositions";
import { getCategoryColor } from "@/lib/utils";
import {
    fetchTLEDataWithFallback,
    getMockSatellites,
} from "@/services/satelliteApi";
import type { Satellite, SatelliteCategory } from "@/types";
import {
    ArrowUpDown,
    Cloud,
    Globe,
    Home,
    Loader2,
    Microscope,
    Navigation,
    Satellite as SatelliteIcon,
    Search,
    Shield,
    Signal,
    Wifi,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const categoryIcons: Record<SatelliteCategory, React.ReactNode> = {
    communication: <Signal className="h-4 w-4" />,
    weather: <Cloud className="h-4 w-4" />,
    navigation: <Navigation className="h-4 w-4" />,
    scientific: <Microscope className="h-4 w-4" />,
    military: <Shield className="h-4 w-4" />,
    "earth-observation": <Globe className="h-4 w-4" />,
    iss: <Home className="h-4 w-4" />,
    starlink: <Wifi className="h-4 w-4" />,
    other: <SatelliteIcon className="h-4 w-4" />,
};

interface SatelliteRowProps {
    satellite: Satellite;
    position:
        | {
              latitude: number;
              longitude: number;
              altitude: number;
              velocity: number;
          }
        | undefined;
}

function SatelliteRow({ satellite, position }: SatelliteRowProps) {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => setExpanded(!expanded)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div
                        className="p-2 rounded-full"
                        style={{
                            backgroundColor: `${getCategoryColor(satellite.category)}20`,
                        }}
                    >
                        {categoryIcons[satellite.category]}
                    </div>
                    <div>
                        <p className="font-medium">{satellite.name}</p>
                        <p className="text-xs text-muted-foreground">
                            NORAD: {satellite.noradId}
                        </p>
                    </div>
                </div>
                <Badge variant="outline" className="capitalize">
                    {satellite.category}
                </Badge>
            </div>

            {expanded && position && (
                <div className="mt-4 pt-4 border-t grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Latitude
                        </p>
                        <p className="font-mono text-sm">
                            {position.latitude.toFixed(4)}°
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Longitude
                        </p>
                        <p className="font-mono text-sm">
                            {position.longitude.toFixed(4)}°
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Altitude
                        </p>
                        <p className="font-mono text-sm">
                            {position.altitude.toFixed(1)} km
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Velocity
                        </p>
                        <p className="font-mono text-sm">
                            {position.velocity.toFixed(2)} km/s
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

const SATELLITE_GROUPS = ["stations", "starlink", "gps-ops", "weather", "geo"];

export function SatelliteTracker() {
    const [satellites, setSatellites] = useState<Satellite[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("name");

    useEffect(() => {
        let cancelled = false;

        async function loadSatellites() {
            setLoading(true);
            try {
                const results = await Promise.all(
                    SATELLITE_GROUPS.map((g) => fetchTLEDataWithFallback(g)),
                );
                if (!cancelled) {
                    setSatellites(results.flat());
                    setLastUpdated(new Date());
                }
            } catch {
                if (!cancelled) {
                    setSatellites(getMockSatellites());
                    setLastUpdated(new Date());
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadSatellites();

        return () => {
            cancelled = true;
        };
    }, []);

    const positions = useSatellitePositions(satellites);

    const filteredSatellites = useMemo(() => {
        let result = [...satellites];

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(
                (sat) =>
                    sat.name.toLowerCase().includes(query) ||
                    sat.noradId.toString().includes(query),
            );
        }

        // Filter by category
        if (categoryFilter !== "all") {
            result = result.filter((sat) => sat.category === categoryFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case "name":
                    return a.name.localeCompare(b.name);
                case "norad":
                    return a.noradId - b.noradId;
                case "altitude":
                    const altA = positions.get(a.id)?.altitude || 0;
                    const altB = positions.get(b.id)?.altitude || 0;
                    return altB - altA;
                default:
                    return 0;
            }
        });

        return result;
    }, [satellites, searchQuery, categoryFilter, sortBy, positions]);

    const categoryStats = useMemo(() => {
        const stats: Record<string, number> = {};
        satellites.forEach((sat) => {
            stats[sat.category] = (stats[sat.category] || 0) + 1;
        });
        return stats;
    }, [satellites]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                    Loading satellite data from CelesTrak...
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <SatelliteIcon className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {satellites.length}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total Satellites
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-indigo-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {categoryStats["starlink"] || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Starlink
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Signal className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {categoryStats["communication"] || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Communication
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Home className="h-5 w-5 text-pink-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {categoryStats["iss"] || 0}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    ISS
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg">
                                Satellite Database
                            </CardTitle>
                            <CardDescription>
                                Real-time tracking of {satellites.length}{" "}
                                satellites using TLE data
                                {lastUpdated && (
                                    <span className="ml-2 text-xs">
                                        · Last updated:{" "}
                                        {lastUpdated.toLocaleTimeString()}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or NORAD ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    All Categories
                                </SelectItem>
                                <SelectItem value="iss">ISS</SelectItem>
                                <SelectItem value="starlink">
                                    Starlink
                                </SelectItem>
                                <SelectItem value="communication">
                                    Communication
                                </SelectItem>
                                <SelectItem value="weather">Weather</SelectItem>
                                <SelectItem value="navigation">
                                    Navigation
                                </SelectItem>
                                <SelectItem value="scientific">
                                    Scientific
                                </SelectItem>
                                <SelectItem value="earth-observation">
                                    Earth Observation
                                </SelectItem>
                                <SelectItem value="military">
                                    Military
                                </SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full md:w-48">
                                <ArrowUpDown className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name">Name</SelectItem>
                                <SelectItem value="norad">NORAD ID</SelectItem>
                                <SelectItem value="altitude">
                                    Altitude
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Separator className="my-4" />

                    <p className="text-sm text-muted-foreground mb-4">
                        Showing {filteredSatellites.length} of{" "}
                        {satellites.length} satellites
                    </p>

                    <ScrollArea className="h-[500px]">
                        <div className="space-y-2">
                            {filteredSatellites.map((satellite) => (
                                <SatelliteRow
                                    key={satellite.id}
                                    satellite={satellite}
                                    position={positions.get(satellite.id)}
                                />
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Category Legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">
                        Satellite Categories
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(categoryIcons).map(
                            ([category, icon]) => (
                                <div
                                    key={category}
                                    className="flex items-center gap-2"
                                >
                                    <div
                                        className="p-2 rounded-full"
                                        style={{
                                            backgroundColor: `${getCategoryColor(category)}20`,
                                        }}
                                    >
                                        {icon}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium capitalize">
                                            {category.replace("-", " ")}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {categoryStats[category] || 0}{" "}
                                            satellites
                                        </p>
                                    </div>
                                </div>
                            ),
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
