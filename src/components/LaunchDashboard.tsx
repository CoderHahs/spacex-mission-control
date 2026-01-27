import { useState, useEffect } from 'react';
import type { Launch } from '@/types';
import { getMockUpcomingLaunches, getMockPastLaunches } from '@/services/launchApi';
import { useCountdown } from '@/hooks/useCountdown';
import { formatDateTime, getStatusColor, truncateText } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Rocket, 
  Calendar, 
  MapPin, 
  Clock, 
  ChevronRight, 
  Radio,
  Globe,
  Building2
} from 'lucide-react';

interface CountdownDisplayProps {
  targetDate: string;
}

function CountdownDisplay({ targetDate }: CountdownDisplayProps) {
  const { days, hours, minutes, seconds, isPast } = useCountdown(targetDate);

  if (isPast) {
    return <span className="text-muted-foreground text-sm">Launched</span>;
  }

  return (
    <div className="flex gap-2 text-center">
      <div className="flex flex-col">
        <span className="countdown-digit text-primary">{days.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">Days</span>
      </div>
      <span className="countdown-digit text-muted-foreground">:</span>
      <div className="flex flex-col">
        <span className="countdown-digit text-primary">{hours.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">Hrs</span>
      </div>
      <span className="countdown-digit text-muted-foreground">:</span>
      <div className="flex flex-col">
        <span className="countdown-digit text-primary">{minutes.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">Min</span>
      </div>
      <span className="countdown-digit text-muted-foreground">:</span>
      <div className="flex flex-col">
        <span className="countdown-digit text-primary">{seconds.toString().padStart(2, '0')}</span>
        <span className="text-xs text-muted-foreground">Sec</span>
      </div>
    </div>
  );
}

interface LaunchCardProps {
  launch: Launch;
  isUpcoming?: boolean;
}

function LaunchCard({ launch, isUpcoming = true }: LaunchCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="flex flex-col md:flex-row">
        {launch.image && (
          <div className="w-full md:w-48 h-48 md:h-auto relative overflow-hidden">
            <img
              src={launch.image}
              alt={launch.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/rocket.svg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>
        )}
        <div className="flex-1 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg leading-tight">{launch.name}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {launch.launch_service_provider.name}
              </p>
            </div>
            <Badge className={`${getStatusColor(launch.status.name)} text-white`}>
              {launch.status.abbrev}
            </Badge>
          </div>

          {isUpcoming && (
            <div className="my-4 p-3 bg-muted/50 rounded-lg">
              <CountdownDisplay targetDate={launch.net} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4 flex-shrink-0" />
              <span>{formatDateTime(launch.net)}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{launch.pad.name}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Rocket className="h-4 w-4 flex-shrink-0" />
              <span>{launch.rocket.configuration.full_name}</span>
            </div>
            {launch.mission?.orbit && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Globe className="h-4 w-4 flex-shrink-0" />
                <span>{launch.mission.orbit.name}</span>
              </div>
            )}
          </div>

          {launch.mission && (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto font-normal"
                onClick={() => setExpanded(!expanded)}
              >
                <ChevronRight className={`h-4 w-4 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                <span className="ml-1">Mission Details</span>
              </Button>
              {expanded && (
                <div className="mt-2 p-3 bg-muted/30 rounded-lg">
                  <p className="text-sm font-medium mb-1">{launch.mission.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {truncateText(launch.mission.description, 200)}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {launch.mission.type}
                  </Badge>
                </div>
              )}
            </div>
          )}

          {launch.webcast_live && (
            <div className="mt-3 flex items-center gap-2 text-red-500">
              <Radio className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">Live Now</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function LaunchDashboard() {
  const [upcomingLaunches, setUpcomingLaunches] = useState<Launch[]>([]);
  const [pastLaunches, setPastLaunches] = useState<Launch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use mock data for development
    setUpcomingLaunches(getMockUpcomingLaunches());
    setPastLaunches(getMockPastLaunches());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  const nextLaunch = upcomingLaunches[0];

  return (
    <div className="space-y-6">
      {/* Featured Next Launch */}
      {nextLaunch && (
        <Card className="gradient-border overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-xl">Next Launch</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-1/3">
                {nextLaunch.image ? (
                  <img
                    src={nextLaunch.image}
                    alt={nextLaunch.name}
                    className="w-full h-48 lg:h-full object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/rocket.svg';
                    }}
                  />
                ) : (
                  <div className="w-full h-48 lg:h-full bg-muted rounded-lg flex items-center justify-center">
                    <Rocket className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="lg:w-2/3 space-y-4">
                <div>
                  <h3 className="text-2xl font-bold">{nextLaunch.name}</h3>
                  <p className="text-muted-foreground">{nextLaunch.launch_service_provider.name}</p>
                </div>
                
                <div className="p-4 bg-muted/50 rounded-lg inline-block">
                  <p className="text-xs text-muted-foreground mb-2">T-Minus</p>
                  <CountdownDisplay targetDate={nextLaunch.net} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Launch Date</p>
                    <p className="font-medium">{formatDateTime(nextLaunch.net)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Launch Site</p>
                    <p className="font-medium">{nextLaunch.pad.location.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Rocket</p>
                    <p className="font-medium">{nextLaunch.rocket.configuration.full_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Status</p>
                    <Badge className={`${getStatusColor(nextLaunch.status.name)} text-white`}>
                      {nextLaunch.status.name}
                    </Badge>
                  </div>
                </div>

                {nextLaunch.mission && (
                  <div>
                    <p className="text-xs text-muted-foreground">Mission</p>
                    <p className="text-sm">{truncateText(nextLaunch.mission.description, 150)}</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Launch Lists */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingLaunches.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="gap-2">
            <Calendar className="h-4 w-4" />
            Recent ({pastLaunches.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {upcomingLaunches.slice(1).map((launch) => (
                <LaunchCard key={launch.id} launch={launch} isUpcoming={true} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="past">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {pastLaunches.map((launch) => (
                <LaunchCard key={launch.id} launch={launch} isUpcoming={false} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <Separator />

      {/* Launch Providers Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Major Launch Providers</CardTitle>
          <CardDescription>Active providers in the global launch market</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {['SpaceX', 'NASA', 'Rocket Lab', 'ULA', 'Roscosmos', 'CNSA', 'Arianespace', 'ISRO'].map(
              (provider) => (
                <Badge key={provider} variant="outline">
                  {provider}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
