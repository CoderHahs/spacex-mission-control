# Space Mission Control 🚀

A comprehensive space tracking website built with React, TypeScript, and modern web technologies. Track rockets, satellites, and space missions in real-time with an interactive 3D globe visualization.

![Space Mission Control](https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1200)

## Features

### 🌍 3D Interactive Globe Visualization
- Interactive 3D Earth globe using Globe.gl and Three.js
- Real-time satellite positions with animated orbital paths
- Launch site locations with interactive markers
- Zoom, rotate, and pan controls

### 🚀 Rocket Launch Tracking Dashboard
- Integration with Launch Library 2 API for comprehensive launch data
- Upcoming launches from all major providers (SpaceX, NASA, Rocket Lab, Roscosmos, CNSA, etc.)
- Past launches with mission details and outcomes
- Countdown timers for upcoming launches
- Launch site information

### 🛰️ Satellite Tracking System
- TLE (Two-Line Element) data integration from CelesTrak
- Real-time satellite position calculations using satellite.js
- Satellite information including name, NORAD ID, orbital parameters
- Categorization by type (communication, weather, ISS, Starlink, etc.)

### 🎯 Space Missions Overview
- Current and upcoming space missions
- Mission objectives, crew information, and timeline
- Mission status and progress indicators

### 📊 Charts and Analytics
- Launch frequency charts by provider and year
- Satellite distribution charts by type and country
- Mission success rate visualizations
- Orbital altitude distribution graphs

### 📰 Space News Feed
- Integration with Spaceflight News API
- Latest space-related articles with images and summaries
- Filtering by topic or source

### 🎨 UI/UX Features
- React with TypeScript for type-safe development
- Shadcn UI component library for modern, accessible interface
- Responsive design for desktop and mobile
- Dark/Light theme support
- Glass-morphism effects and smooth animations

## Tech Stack

- **Frontend Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Radix UI (Shadcn)
- **3D Visualization:** Globe.gl, Three.js
- **Satellite Calculations:** satellite.js
- **Charts:** Recharts
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/CoderHahs/spacex-mission-control.git
cd spacex-mission-control
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## API Integrations

This application integrates with the following APIs:

- **[Launch Library 2](https://thespacedevs.com/llapi)** - Comprehensive rocket launch data
- **[CelesTrak](https://celestrak.org/)** - Satellite TLE data
- **[Spaceflight News API](https://spaceflightnewsapi.net/)** - Space news aggregation

> Note: The application includes mock data for development and demonstration. For production use, ensure you have proper API keys and rate limiting in place.

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Shadcn UI components
│   ├── GlobeVisualization.tsx
│   ├── LaunchDashboard.tsx
│   ├── SatelliteTracker.tsx
│   ├── MissionsOverview.tsx
│   ├── AnalyticsCharts.tsx
│   ├── NewsFeed.tsx
│   └── Navigation.tsx
├── hooks/              # Custom React hooks
├── services/           # API service functions
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
├── App.tsx             # Main application component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Features Overview

### Globe View
The main dashboard features an interactive 3D globe showing:
- Satellite positions updating in real-time
- Launch site locations worldwide
- Orbital paths for selected satellites
- Filter satellites by category

### Launch Dashboard
Track upcoming and past launches with:
- Detailed launch information
- Live countdown timers
- Mission descriptions
- Launch site details

### Satellite Tracker
Comprehensive satellite database with:
- Real-time position tracking
- Orbital parameters
- Search and filter capabilities
- Category-based organization

### Analytics
Visualize space industry data with:
- Launch frequency trends
- Provider comparisons
- Success rate metrics
- Satellite distribution charts

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- SpaceX, NASA, and all space agencies for inspiring exploration
- The Space Devs for providing the Launch Library API
- CelesTrak for satellite tracking data
- Spaceflight News API for news aggregation
