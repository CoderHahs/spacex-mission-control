declare module 'globe.gl' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type DataAccessor<T> = string | ((d: any) => T);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type PointAccessor<T> = (p: any) => T;

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pointsData(data: any[]): GlobeInstance;
    pointLat(accessor: DataAccessor<number>): GlobeInstance;
    pointLng(accessor: DataAccessor<number>): GlobeInstance;
    pointAltitude(accessor: DataAccessor<number> | number): GlobeInstance;
    pointColor(accessor: DataAccessor<string>): GlobeInstance;
    pointRadius(accessor: DataAccessor<number> | number): GlobeInstance;
    pointResolution(resolution: number): GlobeInstance;
    pointLabel(accessor: DataAccessor<string>): GlobeInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onPointClick(callback: (point: any) => void): GlobeInstance;
    
    // Labels
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    labelsData(data: any[]): GlobeInstance;
    labelLat(accessor: DataAccessor<number>): GlobeInstance;
    labelLng(accessor: DataAccessor<number>): GlobeInstance;
    labelText(accessor: DataAccessor<string>): GlobeInstance;
    labelSize(accessor: DataAccessor<number> | number): GlobeInstance;
    labelDotRadius(accessor: DataAccessor<number> | number): GlobeInstance;
    labelColor(accessor: DataAccessor<string>): GlobeInstance;
    labelResolution(resolution: number): GlobeInstance;
    labelLabel(accessor: DataAccessor<string>): GlobeInstance;
    
    // Paths
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathsData(data: any[]): GlobeInstance;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pathPoints(accessor: DataAccessor<any[]>): GlobeInstance;
    pathPointLat(accessor: PointAccessor<number>): GlobeInstance;
    pathPointLng(accessor: PointAccessor<number>): GlobeInstance;
    pathPointAlt(accessor: PointAccessor<number>): GlobeInstance;
    pathColor(accessor: DataAccessor<string>): GlobeInstance;
    pathStroke(accessor: DataAccessor<number> | number): GlobeInstance;
    pathDashLength(accessor: DataAccessor<number> | number): GlobeInstance;
    pathDashGap(accessor: DataAccessor<number> | number): GlobeInstance;
    pathDashAnimateTime(time: number): GlobeInstance;
    pathTransitionDuration(duration: number): GlobeInstance;
    
    // Camera
    pointOfView(pov: { lat?: number; lng?: number; altitude?: number }, transitionMs?: number): GlobeInstance;
    
    // Controls (Three.js OrbitControls)
    controls(): {
      autoRotate: boolean;
      autoRotateSpeed: number;
      enableZoom: boolean;
      enablePan: boolean;
      minDistance: number;
      maxDistance: number;
      zoomSpeed: number;
      rotateSpeed: number;
      enableDamping: boolean;
      dampingFactor: number;
    };
    
    // Lifecycle
    _destructor?(): void;
  }
  
  function Globe(): GlobeInstance;
  export default Globe;
}
