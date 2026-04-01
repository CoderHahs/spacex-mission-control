declare module "globe.gl" {
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
        pointAltitude(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        pointColor(accessor: string | ((d: object) => string)): GlobeInstance;
        pointRadius(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        pointsMerge(merge: boolean): GlobeInstance;
        pointsTransitionDuration(duration: number): GlobeInstance;
        pointLabel(accessor: string | ((d: object) => string)): GlobeInstance;
        onPointClick(callback: (point: object) => void): GlobeInstance;

        // Labels
        labelsData(data: object[]): GlobeInstance;
        labelLat(accessor: string | ((d: object) => number)): GlobeInstance;
        labelLng(accessor: string | ((d: object) => number)): GlobeInstance;
        labelText(accessor: string | ((d: object) => string)): GlobeInstance;
        labelSize(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        labelDotRadius(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        labelColor(accessor: string | ((d: object) => string)): GlobeInstance;
        labelAltitude(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        labelResolution(resolution: string | number): GlobeInstance;
        labelLabel(accessor: string | ((d: object) => string)): GlobeInstance;

        // Paths
        pathsData(data: object[]): GlobeInstance;
        pathPoints(accessor: string | ((d: object) => object[])): GlobeInstance;
        pathPointLat(accessor: (p: object) => number): GlobeInstance;
        pathPointLng(accessor: (p: object) => number): GlobeInstance;
        pathPointAlt(accessor: (p: object) => number): GlobeInstance;
        pathColor(accessor: string | ((d: object) => string)): GlobeInstance;
        pathStroke(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        pathDashLength(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        pathDashGap(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        pathDashAnimateTime(time: number): GlobeInstance;

        // Arcs
        arcsData(data: object[]): GlobeInstance;
        arcStartLat(accessor: string | ((d: object) => number)): GlobeInstance;
        arcStartLng(accessor: string | ((d: object) => number)): GlobeInstance;
        arcEndLat(accessor: string | ((d: object) => number)): GlobeInstance;
        arcEndLng(accessor: string | ((d: object) => number)): GlobeInstance;
        arcColor(
            accessor: string | ((d: object) => string | string[]),
        ): GlobeInstance;
        arcAltitude(
            accessor: number | ((d: object) => number | null),
        ): GlobeInstance;
        arcAltitudeAutoScale(scale: number): GlobeInstance;
        arcStroke(
            accessor: string | number | ((d: object) => number | null),
        ): GlobeInstance;
        arcDashLength(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        arcDashGap(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        arcDashAnimateTime(
            accessor: number | ((d: object) => number),
        ): GlobeInstance;
        arcLabel(accessor: string | ((d: object) => string)): GlobeInstance;

        // HTML Elements
        htmlElementsData(data: object[]): GlobeInstance;
        htmlLat(accessor: string | ((d: object) => number)): GlobeInstance;
        htmlLng(accessor: string | ((d: object) => number)): GlobeInstance;
        htmlAltitude(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        htmlElement(
            accessor: string | ((d: object) => HTMLElement),
        ): GlobeInstance;

        // Custom layer
        customLayerData(data: object[]): GlobeInstance;
        customThreeObject(accessor: (d: object) => object): GlobeInstance;
        customThreeObjectUpdate(
            accessor: (obj: object, d: object) => void,
        ): GlobeInstance;

        // Camera
        pointOfView(
            pov: { lat?: number; lng?: number; altitude?: number },
            transitionMs?: number,
        ): GlobeInstance;

        // Dimensions
        width(width: number): GlobeInstance;
        height(height: number): GlobeInstance;

        // Particles
        particlesData(data: object[]): GlobeInstance;
        particleLat(accessor: string | ((d: object) => number)): GlobeInstance;
        particleLng(accessor: string | ((d: object) => number)): GlobeInstance;
        particleAltitude(
            accessor: string | number | ((d: object) => number),
        ): GlobeInstance;
        particlesColor(
            accessor: string | ((d: object) => string),
        ): GlobeInstance;

        // Hex Bin
        hexBinPointsData(data: object[]): GlobeInstance;
        hexBinPointLat(
            accessor: string | ((d: object) => number),
        ): GlobeInstance;
        hexBinPointLng(
            accessor: string | ((d: object) => number),
        ): GlobeInstance;
        hexBinResolution(resolution: number): GlobeInstance;
        hexAltitude(accessor: number | ((d: object) => number)): GlobeInstance;
        hexTopColor(accessor: string | ((d: object) => string)): GlobeInstance;
        hexSideColor(accessor: string | ((d: object) => string)): GlobeInstance;
        hexBinMerge(merge: boolean): GlobeInstance;

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
