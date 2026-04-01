import { SECTION_TO_PATH } from "@/App";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ARTEMIS_LAUNCH_DATE, isInMissionWindow } from "@/data/artemisData";
import { useTheme } from "@/hooks/useTheme";
import type { NavigationSection } from "@/types/index";
import {
    BarChart3,
    Globe,
    Menu,
    Moon,
    MoonStar,
    Newspaper,
    Rocket,
    Satellite,
    Sun,
    Target,
    X,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface NavigationProps {
    activeSection: NavigationSection;
    onSectionChange: (section: NavigationSection) => void;
}

const navItems: {
    id: NavigationSection;
    label: string;
    icon: React.ReactNode;
}[] = [
    { id: "globe", label: "3D Globe", icon: <Globe className="h-5 w-5" /> },
    {
        id: "artemis",
        label: "Artemis II",
        icon: <MoonStar className="h-5 w-5" />,
    },
    { id: "launches", label: "Launches", icon: <Rocket className="h-5 w-5" /> },
    {
        id: "satellites",
        label: "Satellites",
        icon: <Satellite className="h-5 w-5" />,
    },
    { id: "missions", label: "Missions", icon: <Target className="h-5 w-5" /> },
    {
        id: "analytics",
        label: "Analytics",
        icon: <BarChart3 className="h-5 w-5" />,
    },
    { id: "news", label: "News", icon: <Newspaper className="h-5 w-5" /> },
];

export function Navigation({ activeSection }: NavigationProps) {
    const { theme, toggleTheme } = useTheme();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const showLiveBadge = isInMissionWindow(ARTEMIS_LAUNCH_DATE, new Date());

    return (
        <TooltipProvider>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container flex h-16 items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="absolute inset-0 animate-pulse-glow rounded-full opacity-50" />
                            <Rocket className="h-8 w-8 text-primary relative" />
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="text-lg font-bold glow-text">
                                Space Mission Control
                            </h1>
                            <p className="text-xs text-muted-foreground">
                                Real-time Space Tracking
                            </p>
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navItems.map((item) => (
                            <Tooltip key={item.id}>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            activeSection === item.id
                                                ? "default"
                                                : "ghost"
                                        }
                                        size="sm"
                                        className="gap-2"
                                        asChild
                                    >
                                        <Link to={SECTION_TO_PATH[item.id]}>
                                            {item.icon}
                                            <span className="hidden lg:inline">
                                                {item.label}
                                            </span>
                                            {item.id === "artemis" &&
                                                showLiveBadge && (
                                                    <Badge
                                                        variant="destructive"
                                                        className="animate-pulse px-1.5 py-0 text-[10px] leading-4"
                                                    >
                                                        LIVE
                                                    </Badge>
                                                )}
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{item.label}</p>
                                </TooltipContent>
                            </Tooltip>
                        ))}
                    </nav>

                    {/* Theme Toggle & Mobile Menu */}
                    <div className="flex items-center gap-2">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={toggleTheme}
                                >
                                    {theme === "dark" ? (
                                        <Sun className="h-5 w-5" />
                                    ) : (
                                        <Moon className="h-5 w-5" />
                                    )}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Toggle {theme === "dark" ? "light" : "dark"}{" "}
                                    mode
                                </p>
                            </TooltipContent>
                        </Tooltip>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="md:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? (
                                <X className="h-5 w-5" />
                            ) : (
                                <Menu className="h-5 w-5" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-background">
                        <nav className="container py-4 grid grid-cols-2 gap-2">
                            {navItems.map((item) => (
                                <Button
                                    key={item.id}
                                    variant={
                                        activeSection === item.id
                                            ? "default"
                                            : "ghost"
                                    }
                                    className="justify-start gap-2"
                                    asChild
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Link to={SECTION_TO_PATH[item.id]}>
                                        {item.icon}
                                        {item.label}
                                        {item.id === "artemis" &&
                                            showLiveBadge && (
                                                <Badge
                                                    variant="destructive"
                                                    className="animate-pulse px-1.5 py-0 text-[10px] leading-4"
                                                >
                                                    LIVE
                                                </Badge>
                                            )}
                                    </Link>
                                </Button>
                            ))}
                        </nav>
                    </div>
                )}
            </header>
        </TooltipProvider>
    );
}

export type { NavigationSection };
