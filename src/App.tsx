import { Navigation } from "@/components/Navigation";
import { ARTEMIS_LAUNCH_DATE, getMissionPhase } from "@/data/artemisData";
import type { NavigationSection } from "@/types/index";
import { Rocket } from "lucide-react";
import { Suspense, lazy, useMemo } from "react";
import {
    Navigate,
    Route,
    Routes,
    useLocation,
    useNavigate,
} from "react-router-dom";

// Lazy load components for better performance
const GlobeVisualization = lazy(() =>
    import("@/components/GlobeVisualization").then((m) => ({
        default: m.GlobeVisualization,
    })),
);
const LaunchDashboard = lazy(() =>
    import("@/components/LaunchDashboard").then((m) => ({
        default: m.LaunchDashboard,
    })),
);
const SatelliteTracker = lazy(() =>
    import("@/components/SatelliteTracker").then((m) => ({
        default: m.SatelliteTracker,
    })),
);
const MissionsOverview = lazy(() =>
    import("@/components/MissionsOverview").then((m) => ({
        default: m.MissionsOverview,
    })),
);
const AnalyticsCharts = lazy(() =>
    import("@/components/AnalyticsCharts").then((m) => ({
        default: m.AnalyticsCharts,
    })),
);
const NewsFeed = lazy(() =>
    import("@/components/NewsFeed").then((m) => ({ default: m.NewsFeed })),
);
const ArtemisTracker = lazy(() => import("@/components/ArtemisTracker"));

const PATH_TO_SECTION: Record<string, NavigationSection> = {
    "/": "globe",
    "/artemis-2": "artemis",
    "/launches": "launches",
    "/satellites": "satellites",
    "/missions": "missions",
    "/analytics": "analytics",
    "/news": "news",
};

export const SECTION_TO_PATH: Record<NavigationSection, string> = {
    globe: "/",
    artemis: "/artemis-2",
    launches: "/launches",
    satellites: "/satellites",
    missions: "/missions",
    analytics: "/analytics",
    news: "/news",
};

function LoadingSpinner() {
    return (
        <div className="flex flex-col items-center justify-center h-64">
            <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent" />
                <Rocket className="h-6 w-6 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-muted-foreground mt-4">Loading...</p>
        </div>
    );
}

function App() {
    const location = useLocation();
    const navigate = useNavigate();

    const activeSection: NavigationSection =
        PATH_TO_SECTION[location.pathname] ?? "globe";

    const handleSectionChange = (section: NavigationSection) => {
        navigate(SECTION_TO_PATH[section]);
    };

    // Compute the real mission phase based on current time
    const currentMissionPhase = useMemo(
        () => getMissionPhase(ARTEMIS_LAUNCH_DATE, new Date()),
        [],
    );

    return (
        <div className="min-h-screen bg-background">
            <Navigation
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
            />
            <main>
                <Suspense fallback={<LoadingSpinner />}>
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <div className="h-[calc(100vh-8rem)]">
                                    <GlobeVisualization
                                        className="h-full"
                                        showArtemisTrajectory={true}
                                        currentMissionPhase={
                                            currentMissionPhase
                                        }
                                    />
                                </div>
                            }
                        />
                        <Route
                            path="/artemis-2"
                            element={
                                <div className="container py-6">
                                    <ArtemisTracker
                                        onNavigateToGlobe={() => navigate("/")}
                                    />
                                </div>
                            }
                        />
                        <Route
                            path="/launches"
                            element={
                                <div className="container py-6">
                                    <LaunchDashboard />
                                </div>
                            }
                        />
                        <Route
                            path="/satellites"
                            element={
                                <div className="container py-6">
                                    <SatelliteTracker />
                                </div>
                            }
                        />
                        <Route
                            path="/missions"
                            element={
                                <div className="container py-6">
                                    <MissionsOverview />
                                </div>
                            }
                        />
                        <Route
                            path="/analytics"
                            element={
                                <div className="container py-6">
                                    <AnalyticsCharts />
                                </div>
                            }
                        />
                        <Route
                            path="/news"
                            element={
                                <div className="container py-6">
                                    <NewsFeed />
                                </div>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Suspense>
            </main>
            <footer className="border-t py-6 mt-auto">
                <div className="container">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium">
                                Space Mission Control
                            </span>
                        </div>
                        <div className="text-sm text-muted-foreground text-center md:text-right">
                            <p>
                                Data from Launch Library 2, CelesTrak, and
                                Spaceflight News API
                            </p>
                            <p className="text-xs mt-1">
                                For demonstration purposes. Real-time data
                                requires API integration.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default App;
