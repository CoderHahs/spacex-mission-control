import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getProviderColor } from "@/lib/utils";
import type { AnalyticsData } from "@/services/analyticsApi";
import { getAnalyticsData } from "@/services/analyticsApi";
import {
    AlertCircle,
    BarChart3,
    Loader2,
    PieChart as PieChartIcon,
    Target,
    TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

// Satellite data is not available from Launch Library 2, so we keep static estimates
const satellitesByCategory = [
    { category: "Starlink", count: 7200, percentage: 52 },
    { category: "Communication", count: 1800, percentage: 13 },
    { category: "Earth Observation", count: 1400, percentage: 10 },
    { category: "Navigation", count: 500, percentage: 4 },
    { category: "Weather", count: 350, percentage: 3 },
    { category: "Scientific", count: 300, percentage: 2 },
    { category: "Military", count: 700, percentage: 5 },
    { category: "OneWeb", count: 648, percentage: 5 },
    { category: "Other", count: 900, percentage: 6 },
];

const satellitesByCountry = [
    { country: "USA", count: 8200 },
    { country: "China", count: 1100 },
    { country: "UK", count: 700 },
    { country: "Russia", count: 370 },
    { country: "Japan", count: 150 },
    { country: "India", count: 100 },
    { country: "EU", count: 320 },
    { country: "Other", count: 260 },
];

const orbitalAltitudeData = [
    { range: "200-400km", count: 6500, label: "LEO (Low)" },
    { range: "400-600km", count: 2800, label: "LEO (Mid)" },
    { range: "600-1000km", count: 1200, label: "LEO (High)" },
    { range: "1000-2000km", count: 250, label: "MEO (Low)" },
    { range: "20000-22000km", count: 120, label: "MEO (High)" },
    { range: "35786km", count: 560, label: "GEO" },
];

const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#6b7280",
];

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{ name: string; value: number; color?: string }>;
    label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
                <p className="font-medium mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p
                        key={index}
                        className="text-sm"
                        style={{ color: entry.color }}
                    >
                        {entry.name}: {entry.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
}

export function AnalyticsCharts() {
    const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getAnalyticsData();
                if (!cancelled) setAnalytics(data);
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load analytics data",
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, []);

    const totalSatellites = useMemo(
        () => satellitesByCategory.reduce((sum, item) => sum + item.count, 0),
        [],
    );

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">
                    Loading analytics from Launch Library 2...
                </p>
                <p className="text-xs text-muted-foreground">
                    Fetching launch data for multiple years (this may take a
                    moment)
                </p>
            </div>
        );
    }

    if (error || !analytics) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-destructive font-medium">
                    Unable to load analytics
                </p>
                <p className="text-sm text-muted-foreground">{error}</p>
            </div>
        );
    }

    const latestYear = String(analytics.latestFullYear);

    return (
        <div className="space-y-6">
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {analytics.totalLaunches.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Total Launches ({analytics.yearRange})
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <Target className="h-5 w-5 text-green-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {analytics.overallSuccessRate}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Success Rate
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <PieChartIcon className="h-5 w-5 text-purple-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    {totalSatellites.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Active Satellites (est.)
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-blue-500" />
                            <div>
                                <p className="text-2xl font-bold">
                                    +{analytics.growthPercent}%
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Growth ({analytics.yearRange})
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="launches" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="launches">Launch Analytics</TabsTrigger>
                    <TabsTrigger value="satellites">
                        Satellite Distribution
                    </TabsTrigger>
                    <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="launches" className="space-y-6">
                    {/* Launches by Provider */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Launches by Provider ({latestYear})
                            </CardTitle>
                            <CardDescription>
                                Number of launches by major space launch
                                providers
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.launchesByProvider}
                                        layout="vertical"
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
                                        <XAxis type="number" />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            width={120}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="count"
                                            fill="#3b82f6"
                                            radius={[0, 4, 4, 0]}
                                        >
                                            {analytics.launchesByProvider.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={getProviderColor(
                                                            entry.name,
                                                        )}
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Success Rate by Provider */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Success Rate by Provider ({latestYear})
                            </CardTitle>
                            <CardDescription>
                                Mission success percentage for each provider
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={analytics.launchesByProvider}
                                    >
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[80, 100]} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="successRate"
                                            fill="#10b981"
                                            radius={[4, 4, 0, 0]}
                                        >
                                            {analytics.launchesByProvider.map(
                                                (entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            entry.successRate >=
                                                            95
                                                                ? "#10b981"
                                                                : entry.successRate >=
                                                                    90
                                                                  ? "#f59e0b"
                                                                  : "#ef4444"
                                                        }
                                                    />
                                                ),
                                            )}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Launches by Year */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Annual Launch Trends</CardTitle>
                            <CardDescription>
                                Total launches and successful missions by year
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={analytics.launchesByYear}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
                                        <XAxis dataKey="year" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="total"
                                            stackId="1"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.3}
                                            name="Total Launches"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="success"
                                            stackId="2"
                                            stroke="#10b981"
                                            fill="#10b981"
                                            fillOpacity={0.3}
                                            name="Successful"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="satellites" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Satellites by Category */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Satellites by Category</CardTitle>
                                <CardDescription>
                                    Distribution of active satellites by purpose
                                    (estimated)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={satellitesByCategory}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                dataKey="count"
                                                nameKey="category"
                                                label={({
                                                    category,
                                                    percentage,
                                                }) =>
                                                    `${category} ${percentage}%`
                                                }
                                                labelLine={false}
                                            >
                                                {satellitesByCategory.map(
                                                    (_, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Satellites by Country */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Satellites by Country</CardTitle>
                                <CardDescription>
                                    Distribution of active satellites by
                                    operator country (estimated)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <BarChart data={satellitesByCountry}>
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                opacity={0.3}
                                            />
                                            <XAxis dataKey="country" />
                                            <YAxis />
                                            <Tooltip
                                                content={<CustomTooltip />}
                                            />
                                            <Bar
                                                dataKey="count"
                                                fill="#8b5cf6"
                                                radius={[4, 4, 0, 0]}
                                            >
                                                {satellitesByCountry.map(
                                                    (_, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Orbital Altitude Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Orbital Altitude Distribution</CardTitle>
                            <CardDescription>
                                Number of satellites at different orbital
                                altitudes (estimated)
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={orbitalAltitudeData}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="count"
                                            fill="#06b6d4"
                                            radius={[4, 4, 0, 0]}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="trends" className="space-y-6">
                    {/* Monthly Launch Frequency */}
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                Monthly Launch Frequency ({latestYear})
                            </CardTitle>
                            <CardDescription>
                                Launch distribution throughout the year
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={analytics.monthlyLaunches}>
                                        <CartesianGrid
                                            strokeDasharray="3 3"
                                            opacity={0.3}
                                        />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="launches"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ fill: "#3b82f6" }}
                                            name="Total Launches"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="spacex"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            dot={{ fill: "#10b981" }}
                                            name="SpaceX"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="others"
                                            stroke="#f59e0b"
                                            strokeWidth={2}
                                            dot={{ fill: "#f59e0b" }}
                                            name="Others"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Growth Comparison */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Industry Growth Analysis</CardTitle>
                            <CardDescription>
                                Key growth metrics ({analytics.yearRange})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <p className="text-3xl font-bold text-blue-500">
                                        {analytics.launchesByYear.length >= 2
                                            ? `${(
                                                  analytics.launchesByYear[
                                                      analytics.launchesByYear
                                                          .length - 1
                                                  ].total /
                                                  analytics.launchesByYear[0]
                                                      .total
                                              ).toFixed(1)}x`
                                            : "N/A"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Launch frequency increase
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <p className="text-3xl font-bold text-green-500">
                                        10k+
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Starlink satellites in orbit
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50 text-center">
                                    <p className="text-3xl font-bold text-purple-500">
                                        +{analytics.growthPercent}%
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Annual launch growth
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
