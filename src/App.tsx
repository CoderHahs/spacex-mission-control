import { useState, Suspense, lazy } from 'react';
import { Navigation, type NavigationSection } from '@/components/Navigation';
import { Rocket } from 'lucide-react';

// Lazy load components for better performance
const GlobeVisualization = lazy(() => import('@/components/GlobeVisualization').then(m => ({ default: m.GlobeVisualization })));
const LaunchDashboard = lazy(() => import('@/components/LaunchDashboard').then(m => ({ default: m.LaunchDashboard })));
const SatelliteTracker = lazy(() => import('@/components/SatelliteTracker').then(m => ({ default: m.SatelliteTracker })));
const MissionsOverview = lazy(() => import('@/components/MissionsOverview').then(m => ({ default: m.MissionsOverview })));
const AnalyticsCharts = lazy(() => import('@/components/AnalyticsCharts').then(m => ({ default: m.AnalyticsCharts })));
const NewsFeed = lazy(() => import('@/components/NewsFeed').then(m => ({ default: m.NewsFeed })));

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
  const [activeSection, setActiveSection] = useState<NavigationSection>('globe');

  const renderSection = () => {
    switch (activeSection) {
      case 'globe':
        return (
          <div className="h-[calc(100vh-8rem)]">
            <GlobeVisualization className="h-full" />
          </div>
        );
      case 'launches':
        return (
          <div className="container py-6">
            <LaunchDashboard />
          </div>
        );
      case 'satellites':
        return (
          <div className="container py-6">
            <SatelliteTracker />
          </div>
        );
      case 'missions':
        return (
          <div className="container py-6">
            <MissionsOverview />
          </div>
        );
      case 'analytics':
        return (
          <div className="container py-6">
            <AnalyticsCharts />
          </div>
        );
      case 'news':
        return (
          <div className="container py-6">
            <NewsFeed />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation activeSection={activeSection} onSectionChange={setActiveSection} />
      
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          {renderSection()}
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="border-t py-6 mt-auto">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Space Mission Control</span>
            </div>
            <div className="text-sm text-muted-foreground text-center md:text-right">
              <p>Data from Launch Library 2, CelesTrak, and Spaceflight News API</p>
              <p className="text-xs mt-1">
                For demonstration purposes. Real-time data requires API integration.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
