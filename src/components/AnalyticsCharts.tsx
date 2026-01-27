import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCategoryColor, getProviderColor } from '@/lib/utils';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Target } from 'lucide-react';

// Mock analytics data
const launchesByProviderData = [
  { name: 'SpaceX', count: 96, successRate: 98 },
  { name: 'Rocket Lab', count: 45, successRate: 92 },
  { name: 'ULA', count: 35, successRate: 100 },
  { name: 'Roscosmos', count: 28, successRate: 94 },
  { name: 'CNSA', count: 56, successRate: 95 },
  { name: 'Arianespace', count: 12, successRate: 91 },
  { name: 'ISRO', count: 8, successRate: 88 },
];

const launchesByYearData = [
  { year: '2019', total: 102, success: 95 },
  { year: '2020', total: 114, success: 110 },
  { year: '2021', total: 145, success: 140 },
  { year: '2022', total: 186, success: 180 },
  { year: '2023', total: 223, success: 218 },
  { year: '2024', total: 58, success: 57 },
];

const satellitesByCategory = [
  { category: 'Starlink', count: 5000, percentage: 58 },
  { category: 'Communication', count: 1200, percentage: 14 },
  { category: 'Earth Observation', count: 800, percentage: 9 },
  { category: 'Navigation', count: 400, percentage: 5 },
  { category: 'Weather', count: 300, percentage: 3 },
  { category: 'Scientific', count: 250, percentage: 3 },
  { category: 'Military', count: 500, percentage: 6 },
  { category: 'Other', count: 200, percentage: 2 },
];

const satellitesByCountry = [
  { country: 'USA', count: 5800 },
  { country: 'China', count: 750 },
  { country: 'Russia', count: 350 },
  { country: 'UK', count: 180 },
  { country: 'Japan', count: 120 },
  { country: 'India', count: 80 },
  { country: 'EU', count: 250 },
  { country: 'Other', count: 120 },
];

const orbitalAltitudeData = [
  { range: '200-400km', count: 4500, label: 'LEO (Low)' },
  { range: '400-600km', count: 1200, label: 'LEO (Mid)' },
  { range: '600-1000km', count: 800, label: 'LEO (High)' },
  { range: '1000-2000km', count: 200, label: 'MEO (Low)' },
  { range: '20000-22000km', count: 100, label: 'MEO (High)' },
  { range: '35786km', count: 450, label: 'GEO' },
];

const monthlyLaunchData = [
  { month: 'Jan', launches: 18, spacex: 8, others: 10 },
  { month: 'Feb', launches: 22, spacex: 10, others: 12 },
  { month: 'Mar', launches: 25, spacex: 12, others: 13 },
  { month: 'Apr', launches: 20, spacex: 9, others: 11 },
  { month: 'May', launches: 24, spacex: 11, others: 13 },
  { month: 'Jun', launches: 28, spacex: 14, others: 14 },
  { month: 'Jul', launches: 22, spacex: 10, others: 12 },
  { month: 'Aug', launches: 26, spacex: 13, others: 13 },
  { month: 'Sep', launches: 23, spacex: 11, others: 12 },
  { month: 'Oct', launches: 27, spacex: 14, others: 13 },
  { month: 'Nov', launches: 24, spacex: 12, others: 12 },
  { month: 'Dec', launches: 21, spacex: 9, others: 12 },
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6b7280'];

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
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function AnalyticsCharts() {
  const totalLaunches = useMemo(
    () => launchesByYearData.reduce((sum, item) => sum + item.total, 0),
    []
  );

  const totalSatellites = useMemo(
    () => satellitesByCategory.reduce((sum, item) => sum + item.count, 0),
    []
  );

  const overallSuccessRate = useMemo(() => {
    const total = launchesByYearData.reduce((sum, item) => sum + item.total, 0);
    const success = launchesByYearData.reduce((sum, item) => sum + item.success, 0);
    return ((success / total) * 100).toFixed(1);
  }, []);

  return (
    <div className="space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{totalLaunches}</p>
                <p className="text-xs text-muted-foreground">Total Launches (2019-2024)</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{overallSuccessRate}%</p>
                <p className="text-xs text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{totalSatellites.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Active Satellites</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">+118%</p>
                <p className="text-xs text-muted-foreground">Growth (5 Years)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="launches" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="launches">Launch Analytics</TabsTrigger>
          <TabsTrigger value="satellites">Satellite Distribution</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="launches" className="space-y-6">
          {/* Launches by Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Launches by Provider (2024)</CardTitle>
              <CardDescription>Number of launches by major space launch providers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={launchesByProviderData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                      {launchesByProviderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getProviderColor(entry.name)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Success Rate by Provider */}
          <Card>
            <CardHeader>
              <CardTitle>Success Rate by Provider</CardTitle>
              <CardDescription>Mission success percentage for each provider</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={launchesByProviderData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="name" />
                    <YAxis domain={[80, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="successRate" fill="#10b981" radius={[4, 4, 0, 0]}>
                      {launchesByProviderData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.successRate >= 95 ? '#10b981' : entry.successRate >= 90 ? '#f59e0b' : '#ef4444'}
                        />
                      ))}
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
              <CardDescription>Total launches and successful missions by year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={launchesByYearData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
                <CardDescription>Distribution of active satellites by purpose</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={satellitesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        dataKey="count"
                        nameKey="category"
                        label={({ category, percentage }) => `${category} ${percentage}%`}
                        labelLine={false}
                      >
                        {satellitesByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
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
                <CardDescription>Distribution of active satellites by operator country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={satellitesByCountry}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="country" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                        {satellitesByCountry.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
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
              <CardDescription>Number of satellites at different orbital altitudes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={orbitalAltitudeData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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
              <CardTitle>Monthly Launch Frequency (2023)</CardTitle>
              <CardDescription>Launch distribution throughout the year</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyLaunchData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="launches"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: '#3b82f6' }}
                      name="Total Launches"
                    />
                    <Line
                      type="monotone"
                      dataKey="spacex"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: '#10b981' }}
                      name="SpaceX"
                    />
                    <Line
                      type="monotone"
                      dataKey="others"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={{ fill: '#f59e0b' }}
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
              <CardDescription>Key growth metrics over the past 5 years</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-blue-500">2.2x</p>
                  <p className="text-sm text-muted-foreground">Launch frequency increase</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-green-500">8x</p>
                  <p className="text-sm text-muted-foreground">Satellite constellation growth</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-3xl font-bold text-purple-500">65%</p>
                  <p className="text-sm text-muted-foreground">Reusability adoption</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
