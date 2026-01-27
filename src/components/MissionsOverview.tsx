import { useState } from 'react';
import type { SpaceMission, MissionStatus } from '@/types';
import { getMockMissions, getMockMissionStats } from '@/services/missionApi';
import { formatDate, truncateText } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Rocket,
  Bot,
  Package,
  FlaskConical,
  DollarSign
} from 'lucide-react';

const statusConfig: Record<MissionStatus, { icon: React.ReactNode; color: string; label: string }> = {
  planned: { icon: <Clock className="h-4 w-4" />, color: 'bg-blue-500', label: 'Planned' },
  'in-progress': { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-yellow-500', label: 'In Progress' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, color: 'bg-green-500', label: 'Completed' },
  failed: { icon: <XCircle className="h-4 w-4" />, color: 'bg-red-500', label: 'Failed' },
};

const missionTypeIcons: Record<string, React.ReactNode> = {
  crewed: <Users className="h-4 w-4" />,
  robotic: <Bot className="h-4 w-4" />,
  cargo: <Package className="h-4 w-4" />,
  scientific: <FlaskConical className="h-4 w-4" />,
  commercial: <DollarSign className="h-4 w-4" />,
};

interface MissionCardProps {
  mission: SpaceMission;
}

function MissionCard({ mission }: MissionCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig[mission.status];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={`${status.color} text-white`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              <Badge variant="outline" className="capitalize">
                {missionTypeIcons[mission.type]}
                <span className="ml-1">{mission.type}</span>
              </Badge>
            </div>

            <h3 className="text-xl font-bold mb-1">{mission.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{mission.agency}</p>
            
            <p className="text-sm text-muted-foreground mb-4">
              {truncateText(mission.description, expanded ? 500 : 150)}
              {mission.description.length > 150 && (
                <button
                  className="text-primary hover:underline ml-1"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </p>

            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {formatDate(mission.startDate)}
                  {mission.endDate && ` - ${formatDate(mission.endDate)}`}
                </span>
              </div>
            </div>
          </div>

          {mission.progress !== undefined && (
            <div className="w-full md:w-48">
              <p className="text-xs text-muted-foreground mb-1">Mission Progress</p>
              <Progress value={mission.progress} className="h-2" />
              <p className="text-xs text-right mt-1">{mission.progress}%</p>
            </div>
          )}
        </div>

        {/* Crew Section */}
        {mission.crew && mission.crew.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Crew Members ({mission.crew.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {mission.crew.map((member) => (
                <div
                  key={member.id}
                  className="p-3 rounded-lg bg-muted/50 text-center"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  <Badge variant="outline" className="text-xs mt-1">
                    {member.agency}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Objectives Section */}
        {mission.objectives && mission.objectives.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm font-medium mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Mission Objectives
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {mission.objectives.map((objective, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function MissionsOverview() {
  const [missions] = useState<SpaceMission[]>(getMockMissions());
  const stats = getMockMissionStats();

  const activeMissions = missions.filter((m) => m.status === 'in-progress');
  const plannedMissions = missions.filter((m) => m.status === 'planned');
  const completedMissions = missions.filter((m) => m.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.activeMissions}</p>
                <p className="text-xs text-muted-foreground">Active Missions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.plannedMissions}</p>
                <p className="text-xs text-muted-foreground">Planned Missions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.completedMissions}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.crewInSpace}</p>
                <p className="text-xs text-muted-foreground">Crew in Space</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Space Agencies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contributing Agencies</CardTitle>
          <CardDescription>International space agencies involved in current missions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {stats.agencies.map((agency) => (
              <Badge key={agency} variant="outline" className="px-3 py-1">
                <Rocket className="h-3 w-3 mr-1" />
                {agency}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mission Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active" className="gap-2">
            <AlertCircle className="h-4 w-4" />
            Active ({activeMissions.length})
          </TabsTrigger>
          <TabsTrigger value="planned" className="gap-2">
            <Clock className="h-4 w-4" />
            Planned ({plannedMissions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Completed ({completedMissions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-4">
              {activeMissions.length > 0 ? (
                activeMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No active missions at the moment
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="planned">
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-4">
              {plannedMissions.map((mission) => (
                <MissionCard key={mission.id} mission={mission} />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="completed">
          <ScrollArea className="h-[700px] pr-4">
            <div className="space-y-4">
              {completedMissions.length > 0 ? (
                completedMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No completed missions in the current dataset
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}
