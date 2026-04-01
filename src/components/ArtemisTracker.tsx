import {
    ARTEMIS_CREW,
    ARTEMIS_LAUNCH_DATE,
    MISSION_STATS,
    MISSION_TIMELINE,
    NASA_STREAM_URL,
    getMissionPhase,
} from "@/data/artemisData";
import { useCountdown } from "@/hooks/useCountdown";
import type {
    ArtemisCrewMember,
    ArtemisMissionPhase,
    ArtemisPhase,
} from "@/types";
import {
    CheckCircle2,
    Circle,
    Clock,
    ExternalLink,
    Gauge,
    Globe,
    Map as MapIcon,
    MapPin,
    MoonStar,
    PlayCircle,
    Rocket,
    Timer,
    User,
    Users,
} from "lucide-react";
import { MissionTrajectoryMap } from "./MissionTrajectoryMap";
import {
    Badge,
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    Progress,
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "./ui";

interface ArtemisTrackerProps {
    onNavigateToGlobe?: () => void;
}

const PHASE_ORDER: ArtemisMissionPhase[] = [
    "pre-launch",
    "ascent",
    "earth-orbit",
    "translunar",
    "lunar-flyby",
    "return",
    "reentry",
    "splashdown",
];

const PHASE_LABELS: Record<ArtemisMissionPhase, string> = {
    "pre-launch": "Pre-Launch",
    ascent: "Ascent",
    "earth-orbit": "Earth Orbit",
    translunar: "Translunar Injection",
    "lunar-flyby": "Lunar Flyby",
    return: "Return Transit",
    reentry: "Atmospheric Reentry",
    splashdown: "Splashdown",
};

function CountdownUnit({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center rounded-lg bg-muted/50 p-4">
            <span className="text-4xl font-bold tabular-nums tracking-tight">
                {String(value).padStart(2, "0")}
            </span>
            <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1">
                {label}
            </span>
        </div>
    );
}

function MissionPhaseIndicator({ phase }: { phase: ArtemisMissionPhase }) {
    const idx = PHASE_ORDER.indexOf(phase);
    const progressPercent = ((idx + 1) / PHASE_ORDER.length) * 100;

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary animate-pulse" />
                <span className="text-lg font-semibold">Mission Active</span>
                <Badge variant="success">{PHASE_LABELS[phase]}</Badge>
            </div>
            <Progress value={progressPercent} className="h-2" />
            <p className="text-sm text-muted-foreground">
                Phase {idx + 1} of {PHASE_ORDER.length}
            </p>
        </div>
    );
}

function CrewCard({ member }: { member: ArtemisCrewMember }) {
    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-3 p-4 bg-muted/30">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                    <h4 className="font-semibold truncate">{member.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-xs">
                            {member.role}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                            {member.agency}
                        </Badge>
                    </div>
                </div>
            </div>
            <CardContent className="p-4 pt-3">
                <p className="text-sm text-muted-foreground leading-relaxed">
                    {member.bio}
                </p>
            </CardContent>
        </Card>
    );
}

function getTimelineStatus(
    milestone: ArtemisPhase,
    _currentPhase: ArtemisMissionPhase,
    isPast: boolean,
): "completed" | "active" | "upcoming" {
    if (!isPast) return "upcoming";

    const milestoneTime = milestone.timestamp?.getTime() ?? 0;
    const now = Date.now();

    if (milestoneTime <= now) {
        const milestoneIdx = MISSION_TIMELINE.indexOf(milestone);
        const nextMilestone = MISSION_TIMELINE[milestoneIdx + 1];
        if (
            !nextMilestone ||
            (nextMilestone.timestamp && nextMilestone.timestamp.getTime() > now)
        ) {
            return "active";
        }
        return "completed";
    }
    return "upcoming";
}

function TimelineMilestone({
    milestone,
    status,
}: {
    milestone: ArtemisPhase;
    status: "completed" | "active" | "upcoming";
}) {
    return (
        <div className="flex gap-3 relative">
            <div className="flex flex-col items-center">
                {status === "completed" && (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                )}
                {status === "active" && (
                    <PlayCircle className="h-5 w-5 text-primary animate-pulse shrink-0" />
                )}
                {status === "upcoming" && (
                    <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                )}
                <div className="w-px flex-1 bg-border mt-1" />
            </div>
            <div className="pb-6 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm">
                        {milestone.name}
                    </span>
                    <Badge
                        variant={
                            status === "completed"
                                ? "success"
                                : status === "active"
                                  ? "info"
                                  : "secondary"
                        }
                        className="text-xs"
                    >
                        {milestone.missionElapsedTime}
                    </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {milestone.description}
                </p>
            </div>
        </div>
    );
}

function ArtemisTracker({ onNavigateToGlobe }: ArtemisTrackerProps) {
    const countdown = useCountdown(ARTEMIS_LAUNCH_DATE);
    const currentPhase = getMissionPhase(ARTEMIS_LAUNCH_DATE, new Date());

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <MoonStar className="h-8 w-8 text-primary" />
                        Artemis II
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        First crewed mission to the Moon in over 50 years
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onNavigateToGlobe && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onNavigateToGlobe}
                        >
                            <Globe className="h-4 w-4 mr-2" />
                            View on Globe
                        </Button>
                    )}
                    <Button variant="default" size="sm" asChild>
                        <a
                            href={NASA_STREAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            NASA Live Stream
                        </a>
                    </Button>
                </div>
            </div>

            {/* Countdown / Phase Indicator */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Timer className="h-5 w-5" />
                        {countdown.isPast
                            ? "Mission Status"
                            : "Countdown to Launch"}
                    </CardTitle>
                    <CardDescription>
                        April 1, 2026 at 6:24 PM EDT — Kennedy Space Center,
                        LC-39B
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {countdown.isPast ? (
                        <MissionPhaseIndicator phase={currentPhase} />
                    ) : (
                        <div className="grid grid-cols-4 gap-3">
                            <CountdownUnit
                                value={countdown.days}
                                label="Days"
                            />
                            <CountdownUnit
                                value={countdown.hours}
                                label="Hours"
                            />
                            <CountdownUnit
                                value={countdown.minutes}
                                label="Minutes"
                            />
                            <CountdownUnit
                                value={countdown.seconds}
                                label="Seconds"
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* NASA Live Stream */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <PlayCircle className="h-5 w-5" />
                        NASA Live Stream
                    </CardTitle>
                    <CardDescription>
                        Watch live coverage of the Artemis II mission from NASA
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        className="relative w-full overflow-hidden rounded-lg"
                        style={{ paddingBottom: "56.25%" }}
                    >
                        <iframe
                            className="absolute inset-0 h-full w-full"
                            src={NASA_STREAM_URL.replace("watch?v=", "embed/")}
                            title="NASA Artemis II Live Stream"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">
                        Stream provided by{" "}
                        <a
                            href={NASA_STREAM_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline hover:text-foreground"
                        >
                            NASA TV on YouTube
                        </a>
                    </p>
                </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Tabs defaultValue="tracker" className="space-y-4">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="tracker" className="gap-1.5">
                        <MapIcon className="h-4 w-4" />
                        Tracker
                    </TabsTrigger>
                    <TabsTrigger value="crew" className="gap-1.5">
                        <Users className="h-4 w-4" />
                        Crew
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="gap-1.5">
                        <Clock className="h-4 w-4" />
                        Timeline
                    </TabsTrigger>
                    <TabsTrigger value="stats" className="gap-1.5">
                        <Gauge className="h-4 w-4" />
                        Stats
                    </TabsTrigger>
                </TabsList>

                {/* Tracker Tab */}
                <TabsContent value="tracker">
                    <MissionTrajectoryMap />
                </TabsContent>

                {/* Crew Tab */}
                <TabsContent value="crew">
                    <div className="grid gap-4 sm:grid-cols-2">
                        {ARTEMIS_CREW.map((member) => (
                            <CrewCard key={member.name} member={member} />
                        ))}
                    </div>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg">
                                Mission Timeline
                            </CardTitle>
                            <CardDescription>
                                12 key milestones from liftoff to splashdown
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0">
                                {MISSION_TIMELINE.map((milestone) => {
                                    const status = getTimelineStatus(
                                        milestone,
                                        currentPhase,
                                        countdown.isPast,
                                    );
                                    return (
                                        <TimelineMilestone
                                            key={milestone.id}
                                            milestone={milestone}
                                            status={status}
                                        />
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                Total Distance
                                            </CardDescription>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <MapPin className="h-5 w-5 text-blue-500" />
                                                {MISSION_STATS.totalDistance}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Round-trip distance of the Artemis II
                                    mission
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                Mission Duration
                                            </CardDescription>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <Clock className="h-5 w-5 text-green-500" />
                                                {MISSION_STATS.duration}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Total mission duration from launch to
                                    splashdown
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                Reentry Speed
                                            </CardDescription>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <Gauge className="h-5 w-5 text-orange-500" />
                                                {MISSION_STATS.reentrySpeed}
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Speed at atmospheric reentry — Mach 32
                                </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardDescription>
                                                Beyond the Moon
                                            </CardDescription>
                                            <CardTitle className="text-2xl flex items-center gap-2">
                                                <MoonStar className="h-5 w-5 text-purple-500" />
                                                {
                                                    MISSION_STATS.distanceBeyondMoon
                                                }
                                            </CardTitle>
                                        </CardHeader>
                                    </Card>
                                </TooltipTrigger>
                                <TooltipContent>
                                    Distance past the far side of the Moon
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default ArtemisTracker;
