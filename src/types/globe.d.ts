declare module 'globe.gl' {
  interface GlobeInstance {
    (element: HTMLElement): GlobeInstance;
    
    // Globe appearance
    globeImageUrl(url: string): GlobeInstance;
    bumpImageUrl(url: string): GlobeInstance;
    backgroundImageUrl(url: string): GlobeInstance;
    showAtmosphere(show: boolean): GlobeInstance;
    atmosphereColor(color: string): GlobeInstance;
    atmosphereAltitude(altitude: number): GlobeInstance;
    
    // Points
    pointsData(data: object[]): GlobeInstance;
    pointLat(accessor: string | ((d: object) => number)): GlobeInstance;
    pointLng(accessor: string | ((d: object) => number)): GlobeInstance;
    pointAltitude(accessor: string | number | ((d: object) => number)): GlobeInstance;
    pointColor(accessor: string | ((d: object) => string)): GlobeInstance;
    pointRadius(accessor: string | number | ((d: object) => number)): GlobeInstance;
    pointLabel(accessor: string | ((d: object) => string)): GlobeInstance;
    onPointClick(callback: (point: object) => void): GlobeInstance;
    
    // Labels
    labelsData(data: object[]): GlobeInstance;
    labelLat(accessor: string | ((d: object) => number)): GlobeInstance;
    labelLng(accessor: string | ((d: object) => number)): GlobeInstance;
    labelText(accessor: string | ((d: object) => string)): GlobeInstance;
    labelSize(accessor: string | number | ((d: object) => number)): GlobeInstance;
    labelDotRadius(accessor: string | number | ((d: object) => number)): GlobeInstance;
    labelColor(accessor: string | ((d: object) => string)): GlobeInstance;
    labelResolution(resolution: number): GlobeInstance;
    labelLabel(accessor: string | ((d: object) => string)): GlobeInstance;
    
    // Paths
    pathsData(data: object[]): GlobeInstance;
    pathPoints(accessor: string | ((d: object) => object[])): GlobeInstance;
    pathPointLat(accessor: ((p: object) => number)): GlobeInstance;
    pathPointLng(accessor: ((p: object) => number)): GlobeInstance;
    pathPointAlt(accessor: ((p: object) => number)): GlobeInstance;
    pathColor(accessor: string | ((d: object) => string)): GlobeInstance;
    pathStroke(accessor: string | number | ((d: object) => number)): GlobeInstance;
    pathDashLength(accessor: string | number | ((d: object) => number)): GlobeInstance;
    pathDashGap(accessor: string | number | ((d: object) => number)): GlobeInstance;
    pathDashAnimateTime(time: number): GlobeInstance;
    
    // Camera
    pointOfView(pov: { lat?: number; lng?: number; altitude?: number }, transitionMs?: number): GlobeInstance;
    
    // Controls
    controls(): {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
    };
    
    // Lifecycle
    _destructor?(): void;
  }
  
  function Globe(): GlobeInstance;
  export default Globe;
}
