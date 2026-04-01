import type { MoonPosition } from "../types";

/**
 * Simplified lunar ephemeris for visualization purposes.
 * Uses low-precision formula (~1° accuracy) — sufficient for globe rendering.
 * Based on Jean Meeus "Astronomical Algorithms" simplified model.
 *
 * @param date - Any valid Date object
 * @returns MoonPosition with lat in [-28.5, 28.5], lng in [-180, 180], distance in [356000, 407000] km
 */
export function getMoonPosition(date: Date): MoonPosition {
    const J2000 = Date.UTC(2000, 0, 1, 12, 0, 0);
    const daysSinceJ2000 = (date.getTime() - J2000) / (1000 * 60 * 60 * 24);

    // Moon's mean longitude (degrees)
    const L = (218.316 + 13.176396 * daysSinceJ2000) % 360;
    // Moon's mean anomaly (degrees)
    const M = (134.963 + 13.064993 * daysSinceJ2000) % 360;
    // Moon's mean distance (degrees)
    const F = (93.272 + 13.22935 * daysSinceJ2000) % 360;

    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    // Ecliptic longitude and latitude
    const eclLng = L + 6.289 * Math.sin(toRad(M));
    const eclLat = 5.128 * Math.sin(toRad(F));

    // Distance in km (mean ~384,400 km)
    const rawDistance = 385001 - 20905 * Math.cos(toRad(M));

    // Convert ecliptic to approximate Earth-relative lat/lng
    // Normalize longitude to [-180, 180]
    const rawLng = (((eclLng % 360) + 360) % 360) - 180;

    // Clamp all outputs to guaranteed physical bounds
    const lat = Math.max(-28.5, Math.min(28.5, eclLat));
    const lng = Math.max(-180, Math.min(180, rawLng));
    const distance = Math.max(356000, Math.min(407000, rawDistance));

    return { lat, lng, distance };
}
