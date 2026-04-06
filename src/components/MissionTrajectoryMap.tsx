import { ARTEMIS_LAUNCH_DATE, MISSION_TIMELINE } from "@/data/artemisData";
import { useCountdown } from "@/hooks/useCountdown";
import type { ArtemisMissionPhase } from "@/types";
import { useEffect, useMemo, useState } from "react";

// ── Layout constants ────────────────────────────────────────────────
const W = 960;
const H = 600;
const EARTH = { x: 175, y: 440 };
const EARTH_R = 70;
const MOON = { x: 820, y: 230 };
const MOON_R = 45;

// Waypoint positions matching the NASA diagram layout:
// Earth bottom-left, outbound arcs up-right to Moon, return curves below
const WP: { x: number; y: number; labelDx: number; labelDy: number }[] = [
    // 1  Liftoff — at Earth surface, bottom
    { x: 155, y: 500, labelDx: -10, labelDy: 18 },
    // 2  MECO — on Earth, upper-left
    { x: 180, y: 400, labelDx: -70, labelDy: -4 },
    // 3  Earth Orbit Insertion — orbit ring, left of Earth
    { x: 225, y: 340, labelDx: -100, labelDy: 8 },
    // 4  TLI — departing orbit, above-left
    { x: 290, y: 275, labelDx: -90, labelDy: 8 },
    // 5  ICPS Separation — outbound
    { x: 370, y: 225, labelDx: -80, labelDy: -10 },
    // 6  Outbound Coast — mid-transit
    { x: 500, y: 175, labelDx: -20, labelDy: -18 },
    // 7  Lunar Approach — nearing Moon
    { x: 660, y: 150, labelDx: 10, labelDy: -18 },
    // 8  Closest Lunar Approach — top-right past Moon
    { x: 810, y: 130, labelDx: -20, labelDy: -20 },
    // 9  Return Trajectory Burn — right of Moon, below
    { x: 820, y: 300, labelDx: 10, labelDy: 18 },
    // 10 Return Coast — mid-return, below outbound
    { x: 590, y: 370, labelDx: 10, labelDy: 18 },
    // 11 Atmospheric Reentry — approaching Earth from right
    { x: 365, y: 440, labelDx: 10, labelDy: 18 },
    // 12 Splashdown — near Earth, bottom-right
    { x: 200, y: 520, labelDx: 10, labelDy: 18 },
];

const PHASE_COLORS: Record<ArtemisMissionPhase, string> = {
    "pre-launch": "#6b7280",
    ascent: "#ef4444",
    "earth-orbit": "#3b82f6",
    translunar: "#f97316",
    "lunar-flyby": "#eab308",
    return: "#22c55e",
    reentry: "#ef4444",
    splashdown: "#a855f7",
};

const MILESTONE_PHASES: ArtemisMissionPhase[] = [
    "ascent",
    "ascent",
    "earth-orbit",
    "translunar",
    "translunar",
    "translunar",
    "lunar-flyby",
    "lunar-flyby",
    "return",
    "return",
    "reentry",
    "splashdown",
];

const LEGEND: { label: string; color: string }[] = [
    { label: "Ascent", color: PHASE_COLORS.ascent },
    { label: "Earth Orbit", color: PHASE_COLORS["earth-orbit"] },
    { label: "Translunar", color: PHASE_COLORS.translunar },
    { label: "Lunar Flyby", color: PHASE_COLORS["lunar-flyby"] },
    { label: "Return", color: PHASE_COLORS.return },
    { label: "Reentry", color: PHASE_COLORS.reentry },
    { label: "Splashdown", color: PHASE_COLORS.splashdown },
];

// ── Pre-launch readiness checks ─────────────────────────────────────
const PRE_LAUNCH_CHECKS = [
    { label: "SLS Vehicle Assembly", done: true },
    { label: "Orion Spacecraft Integration", done: true },
    { label: "Launch Abort System", done: true },
    { label: "Flight Software Upload", done: true },
    { label: "Crew Ingress & Closeout", done: true },
    { label: "Terminal Countdown", done: false },
];

// ── Path helpers ────────────────────────────────────────────────────

/** Smooth Catmull-Rom spline through waypoints */
function buildSplinePath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(i - 1, 0)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(i + 2, pts.length - 1)];
        const t = 0.35;
        d += ` C ${p1.x + (p2.x - p0.x) * t} ${p1.y + (p2.y - p0.y) * t}, ${p2.x - (p3.x - p1.x) * t} ${p2.y - (p3.y - p1.y) * t}, ${p2.x} ${p2.y}`;
    }
    return d;
}

/** Earth orbit ellipse path (tilted) for the orbit loops around Earth */
function earthOrbitPath(rx: number, ry: number, tilt: number): string {
    const cos = Math.cos(tilt);
    const sin = Math.sin(tilt);
    const pts: string[] = [];
    for (let a = 0; a <= 360; a += 4) {
        const rad = (a * Math.PI) / 180;
        const ox = rx * Math.cos(rad);
        const oy = ry * Math.sin(rad);
        const x = EARTH.x + ox * cos - oy * sin;
        const y = EARTH.y + ox * sin + oy * cos;
        pts.push(`${a === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`);
    }
    return pts.join(" ") + " Z";
}

// ── State helpers ───────────────────────────────────────────────────

function getActiveWaypointIndex(): number {
    const now = Date.now();
    const launch = ARTEMIS_LAUNCH_DATE.getTime();
    if (now < launch) return -1;
    for (let i = MISSION_TIMELINE.length - 1; i >= 0; i--) {
        const ts = MISSION_TIMELINE[i].timestamp;
        if (ts && now >= ts.getTime()) return i;
    }
    return 0;
}

/** Evaluate cubic Bézier at parameter t */
function cubicBezier(
    p0: number,
    cp1: number,
    cp2: number,
    p1: number,
    t: number,
): number {
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * cp1 + 3 * u * t * t * cp2 + t * t * t * p1;
}

function getOrionPos(idx: number): { x: number; y: number } {
    if (idx < 0) return WP[0];
    if (idx >= WP.length - 1) return WP[WP.length - 1];
    const now = Date.now();
    const cur = MISSION_TIMELINE[idx].timestamp?.getTime() ?? now;
    const nxt = MISSION_TIMELINE[idx + 1]?.timestamp?.getTime() ?? cur + 1;
    const t = Math.min(Math.max((now - cur) / (nxt - cur), 0), 1);

    // Compute the same Catmull-Rom → cubic Bézier control points as buildSplinePath
    const p0 = WP[Math.max(idx - 1, 0)];
    const p1 = WP[idx];
    const p2 = WP[idx + 1];
    const p3 = WP[Math.min(idx + 2, WP.length - 1)];
    const tension = 0.35;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    return {
        x: cubicBezier(p1.x, cp1x, cp2x, p2.x, t),
        y: cubicBezier(p1.y, cp1y, cp2y, p2.y, t),
    };
}

function wpStatus(
    i: number,
    active: number,
): "completed" | "active" | "upcoming" {
    if (active < 0) return "upcoming";
    if (i < active) return "completed";
    if (i === active) return "active";
    return "upcoming";
}

// ── Deterministic stars ─────────────────────────────────────────────
function seededRandom(seed: number) {
    let s = seed;
    return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

const STARS: { cx: number; cy: number; r: number; o: number }[] = (() => {
    const rng = seededRandom(42);
    return Array.from({ length: 120 }, () => ({
        cx: rng() * W,
        cy: rng() * H,
        r: 0.4 + rng() * 1.0,
        o: 0.15 + rng() * 0.35,
    }));
})();

// ── Component ───────────────────────────────────────────────────────

export function MissionTrajectoryMap() {
    const [, setTick] = useState(0);
    const activeIdx = getActiveWaypointIndex();
    const orionPos = getOrionPos(activeIdx);
    const mainPath = useMemo(() => buildSplinePath(WP), []);
    const orbit1 = useMemo(
        () => earthOrbitPath(EARTH_R + 18, EARTH_R + 6, -0.35),
        [],
    );
    const orbit2 = useMemo(
        () => earthOrbitPath(EARTH_R + 28, EARTH_R + 12, -0.25),
        [],
    );
    const countdown = useCountdown(ARTEMIS_LAUNCH_DATE);
    const isPreLaunch = activeIdx < 0;

    useEffect(() => {
        const id = setInterval(() => setTick((t) => t + 1), 2000);
        return () => clearInterval(id);
    }, []);

    return (
        <div className="w-full overflow-x-auto rounded-xl bg-[#0b1120]">
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto min-w-[640px]"
                role="img"
                aria-label="Artemis II mission trajectory showing Orion's flight path from Earth to the Moon and back"
            >
                <defs>
                    <radialGradient id="bg-grad" cx="30%" cy="60%" r="80%">
                        <stop offset="0%" stopColor="#111827" />
                        <stop offset="100%" stopColor="#030712" />
                    </radialGradient>
                    <radialGradient id="e-grad" cx="38%" cy="32%">
                        <stop offset="0%" stopColor="#1a6fc4" />
                        <stop offset="50%" stopColor="#1558a0" />
                        <stop offset="100%" stopColor="#0c2d5a" />
                    </radialGradient>
                    <radialGradient id="e-glow" cx="50%" cy="50%" r="50%">
                        <stop
                            offset="60%"
                            stopColor="#3b82f6"
                            stopOpacity="0.18"
                        />
                        <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity="0"
                        />
                    </radialGradient>
                    {/* Atmosphere rim light */}
                    <radialGradient id="e-atmo" cx="50%" cy="50%" r="50%">
                        <stop
                            offset="82%"
                            stopColor="#60a5fa"
                            stopOpacity="0"
                        />
                        <stop
                            offset="94%"
                            stopColor="#60a5fa"
                            stopOpacity="0.25"
                        />
                        <stop
                            offset="100%"
                            stopColor="#93c5fd"
                            stopOpacity="0.08"
                        />
                    </radialGradient>
                    {/* Specular highlight */}
                    <radialGradient id="e-spec" cx="32%" cy="28%" r="40%">
                        <stop
                            offset="0%"
                            stopColor="white"
                            stopOpacity="0.18"
                        />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    {/* Cloud haze */}
                    <radialGradient id="e-cloud" cx="45%" cy="40%" r="50%">
                        <stop
                            offset="0%"
                            stopColor="white"
                            stopOpacity="0.08"
                        />
                        <stop
                            offset="60%"
                            stopColor="white"
                            stopOpacity="0.04"
                        />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </radialGradient>
                    {/* Clip to Earth sphere */}
                    <clipPath id="earth-clip">
                        <circle cx={EARTH.x} cy={EARTH.y} r={EARTH_R} />
                    </clipPath>
                    <radialGradient id="m-grad" cx="35%" cy="30%">
                        <stop offset="0%" stopColor="#f3f4f6" />
                        <stop offset="60%" stopColor="#d1d5db" />
                        <stop offset="100%" stopColor="#9ca3af" />
                    </radialGradient>
                    <radialGradient id="m-glow" cx="50%" cy="50%" r="50%">
                        <stop
                            offset="60%"
                            stopColor="#d1d5db"
                            stopOpacity="0.08"
                        />
                        <stop
                            offset="100%"
                            stopColor="#d1d5db"
                            stopOpacity="0"
                        />
                    </radialGradient>
                    <filter id="trail-glow">
                        <feGaussianBlur stdDeviation="4" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="trail-glow-sm">
                        <feGaussianBlur stdDeviation="2" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                    <filter id="orion-bloom">
                        <feGaussianBlur stdDeviation="6" result="b" />
                        <feMerge>
                            <feMergeNode in="b" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Background */}
                <rect width={W} height={H} fill="url(#bg-grad)" rx="12" />

                {/* Stars */}
                {STARS.map((s, i) => (
                    <circle
                        key={i}
                        cx={s.cx}
                        cy={s.cy}
                        r={s.r}
                        fill="white"
                        opacity={s.o}
                    />
                ))}

                {/* ── Earth ─────────────────────────────────────── */}
                <circle
                    cx={EARTH.x}
                    cy={EARTH.y}
                    r={EARTH_R + 30}
                    fill="url(#e-glow)"
                />
                <circle
                    cx={EARTH.x}
                    cy={EARTH.y}
                    r={EARTH_R}
                    fill="url(#e-grad)"
                />
                {/* Subtle continent hints */}
                <ellipse
                    cx={EARTH.x - 15}
                    cy={EARTH.y - 10}
                    rx="22"
                    ry="16"
                    fill="#34d399"
                    opacity="0.12"
                />
                <ellipse
                    cx={EARTH.x + 20}
                    cy={EARTH.y + 15}
                    rx="18"
                    ry="12"
                    fill="#34d399"
                    opacity="0.08"
                />
                <text
                    x={EARTH.x}
                    y={EARTH.y + EARTH_R + 22}
                    textAnchor="middle"
                    fill="#60a5fa"
                    fontSize="14"
                    fontWeight="700"
                >
                    Earth
                </text>

                {/* Earth orbit rings */}
                <path
                    d={orbit1}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="0.8"
                    strokeOpacity="0.2"
                    strokeDasharray="4 3"
                />
                <path
                    d={orbit2}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="0.6"
                    strokeOpacity="0.12"
                    strokeDasharray="3 4"
                />

                {/* ── Moon ──────────────────────────────────────── */}
                <circle
                    cx={MOON.x}
                    cy={MOON.y}
                    r={MOON_R + 20}
                    fill="url(#m-glow)"
                />
                <circle
                    cx={MOON.x}
                    cy={MOON.y}
                    r={MOON_R}
                    fill="url(#m-grad)"
                />
                {/* Craters */}
                <circle
                    cx={MOON.x - 12}
                    cy={MOON.y - 8}
                    r="7"
                    fill="#9ca3af"
                    opacity="0.25"
                />
                <circle
                    cx={MOON.x + 14}
                    cy={MOON.y + 10}
                    r="5"
                    fill="#9ca3af"
                    opacity="0.2"
                />
                <circle
                    cx={MOON.x + 4}
                    cy={MOON.y - 16}
                    r="4"
                    fill="#9ca3af"
                    opacity="0.15"
                />
                <circle
                    cx={MOON.x - 6}
                    cy={MOON.y + 14}
                    r="6"
                    fill="#9ca3af"
                    opacity="0.18"
                />
                {/* Moon highlight arc */}
                <path
                    d={`M ${MOON.x - 20} ${MOON.y - 38} A ${MOON_R} ${MOON_R} 0 0 1 ${MOON.x + 30} ${MOON.y + 30}`}
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeOpacity="0.08"
                />
                <text
                    x={MOON.x}
                    y={MOON.y + MOON_R + 22}
                    textAnchor="middle"
                    fill="#d1d5db"
                    fontSize="14"
                    fontWeight="700"
                >
                    Moon
                </text>

                {/* ── Trajectory trail (multi-strand glow) ──────── */}
                {/* Wide outer glow */}
                <path
                    d={mainPath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="12"
                    strokeOpacity="0.06"
                    filter="url(#trail-glow)"
                />
                {/* Medium glow */}
                <path
                    d={mainPath}
                    fill="none"
                    stroke="#60a5fa"
                    strokeWidth="6"
                    strokeOpacity="0.1"
                    filter="url(#trail-glow-sm)"
                />
                {/* Core bright line */}
                <path
                    d={mainPath}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="2"
                    strokeOpacity="0.35"
                />
                {/* Animated dashes on top */}
                <path
                    d={mainPath}
                    fill="none"
                    stroke="#bfdbfe"
                    strokeWidth="1.2"
                    strokeOpacity="0.25"
                    strokeDasharray="8 12"
                    strokeDashoffset="0"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="0"
                        to="-40"
                        dur="3s"
                        repeatCount="indefinite"
                    />
                </path>
                {/* Second offset animated strand */}
                <path
                    d={mainPath}
                    fill="none"
                    stroke="#93c5fd"
                    strokeWidth="0.8"
                    strokeOpacity="0.18"
                    strokeDasharray="4 16"
                    strokeDashoffset="10"
                >
                    <animate
                        attributeName="stroke-dashoffset"
                        from="10"
                        to="-30"
                        dur="4s"
                        repeatCount="indefinite"
                    />
                </path>

                {/* ── Waypoint markers ──────────────────────────── */}
                {WP.map((pos, i) => {
                    const status = wpStatus(i, activeIdx);
                    const milestone = MISSION_TIMELINE[i];
                    const color = PHASE_COLORS[MILESTONE_PHASES[i]];
                    const r = status === "active" ? 16 : 13;
                    const labelX = pos.x + pos.labelDx;
                    const labelY = pos.y + pos.labelDy;

                    return (
                        <g key={i}>
                            {/* Pulse for active */}
                            {status === "active" && (
                                <circle
                                    cx={pos.x}
                                    cy={pos.y}
                                    r={r}
                                    fill="none"
                                    stroke={color}
                                    strokeWidth="2"
                                >
                                    <animate
                                        attributeName="r"
                                        from="16"
                                        to="26"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        from="0.6"
                                        to="0"
                                        dur="1.5s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            )}

                            {/* Marker circle */}
                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={r}
                                fill={
                                    status === "upcoming"
                                        ? "#1e293b"
                                        : "#1e293b"
                                }
                                stroke={
                                    status === "upcoming" ? "#475569" : color
                                }
                                strokeWidth={status === "active" ? 2.5 : 1.8}
                                opacity={status === "upcoming" ? 0.7 : 1}
                            />

                            {/* Number */}
                            <text
                                x={pos.x}
                                y={pos.y + 1}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill={
                                    status === "upcoming" ? "#94a3b8" : "white"
                                }
                                fontSize={status === "active" ? "12" : "10"}
                                fontWeight="700"
                            >
                                {i + 1}
                            </text>

                            {/* Label */}
                            <text
                                x={labelX}
                                y={labelY}
                                textAnchor={pos.labelDx < 0 ? "end" : "start"}
                                fill={
                                    status === "upcoming"
                                        ? "#64748b"
                                        : "#cbd5e1"
                                }
                                fontSize="10"
                                fontWeight={status === "active" ? "600" : "400"}
                            >
                                {milestone?.name ?? `Step ${i + 1}`}
                            </text>
                        </g>
                    );
                })}

                {/* ── Orion marker ──────────────────────────────── */}
                {activeIdx >= 0 && (
                    <g filter="url(#orion-bloom)">
                        <circle
                            cx={orionPos.x}
                            cy={orionPos.y}
                            r="18"
                            fill="#f97316"
                            opacity="0.12"
                        />
                        <circle
                            cx={orionPos.x}
                            cy={orionPos.y}
                            r="10"
                            fill="#f97316"
                            opacity="0.25"
                        />
                        <circle
                            cx={orionPos.x}
                            cy={orionPos.y}
                            r="5"
                            fill="#fb923c"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                        >
                            <animate
                                attributeName="r"
                                values="4;6;4"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </circle>
                        <text
                            x={orionPos.x}
                            y={orionPos.y - 16}
                            textAnchor="middle"
                            fill="#fbbf24"
                            fontSize="10"
                            fontWeight="700"
                        >
                            🚀 Orion
                        </text>
                    </g>
                )}

                {/* ── Pre-launch checks panel ────────────────────── */}
                {isPreLaunch && (
                    <g>
                        {/* Panel background — positioned upper-right */}
                        <rect
                            x="540"
                            y="340"
                            width="280"
                            height="230"
                            rx="10"
                            fill="#0f172a"
                            stroke="#1e3a5f"
                            strokeWidth="1"
                            opacity="0.92"
                        />

                        {/* Panel header */}
                        <text
                            x="560"
                            y="366"
                            fill="#fbbf24"
                            fontSize="13"
                            fontWeight="700"
                        >
                            🚀 PRE-LAUNCH CHECKS
                        </text>
                        <line
                            x1="560"
                            y1="374"
                            x2="800"
                            y2="374"
                            stroke="#1e3a5f"
                            strokeWidth="0.8"
                        />

                        {/* Countdown */}
                        <text x="560" y="396" fill="#94a3b8" fontSize="10">
                            T-minus
                        </text>
                        <text
                            x="610"
                            y="396"
                            fill="#60a5fa"
                            fontSize="10"
                            fontWeight="700"
                        >
                            {String(countdown.days).padStart(2, "0")}d{" "}
                            {String(countdown.hours).padStart(2, "0")}h{" "}
                            {String(countdown.minutes).padStart(2, "0")}m{" "}
                            {String(countdown.seconds).padStart(2, "0")}s
                        </text>

                        {/* Checklist items */}
                        {PRE_LAUNCH_CHECKS.map((check, i) => {
                            const cy = 420 + i * 22;
                            return (
                                <g key={check.label}>
                                    {/* Checkbox */}
                                    <rect
                                        x="560"
                                        y={cy - 7}
                                        width="14"
                                        height="14"
                                        rx="3"
                                        fill={
                                            check.done
                                                ? "#22c55e"
                                                : "transparent"
                                        }
                                        stroke={
                                            check.done ? "#22c55e" : "#475569"
                                        }
                                        strokeWidth="1.5"
                                    />
                                    {check.done && (
                                        <path
                                            d={`M ${563} ${cy + 1} l 2.5 3 l 5 -6`}
                                            fill="none"
                                            stroke="white"
                                            strokeWidth="1.8"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    )}
                                    {/* Label */}
                                    <text
                                        x="582"
                                        y={cy + 4}
                                        fill={
                                            check.done ? "#cbd5e1" : "#64748b"
                                        }
                                        fontSize="10.5"
                                        fontWeight={check.done ? "400" : "500"}
                                    >
                                        {check.label}
                                    </text>
                                    {/* Status badge */}
                                    {check.done ? (
                                        <text
                                            x="780"
                                            y={cy + 4}
                                            fill="#22c55e"
                                            fontSize="9"
                                            fontWeight="600"
                                            textAnchor="end"
                                        >
                                            GO
                                        </text>
                                    ) : (
                                        <text
                                            x="780"
                                            y={cy + 4}
                                            fill="#fbbf24"
                                            fontSize="9"
                                            fontWeight="600"
                                            textAnchor="end"
                                        >
                                            PENDING
                                        </text>
                                    )}
                                </g>
                            );
                        })}

                        {/* Status summary */}
                        <line
                            x1="560"
                            y1="554"
                            x2="800"
                            y2="554"
                            stroke="#1e3a5f"
                            strokeWidth="0.8"
                        />
                        <circle cx="570" cy="564" r="4" fill="#fbbf24">
                            <animate
                                attributeName="opacity"
                                values="1;0.4;1"
                                dur="1.5s"
                                repeatCount="indefinite"
                            />
                        </circle>
                        <text
                            x="580"
                            y="568"
                            fill="#fbbf24"
                            fontSize="10"
                            fontWeight="600"
                        >
                            TERMINAL COUNTDOWN IMMINENT
                        </text>

                        {/* Pulsing highlight ring around Earth / launch pad */}
                        <circle
                            cx={EARTH.x}
                            cy={EARTH.y}
                            r={EARTH_R + 8}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="1.5"
                            strokeDasharray="6 4"
                        >
                            <animate
                                attributeName="stroke-dashoffset"
                                from="0"
                                to="-20"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </circle>
                        <circle
                            cx={EARTH.x}
                            cy={EARTH.y}
                            r={EARTH_R + 16}
                            fill="none"
                            stroke="#fbbf24"
                            strokeWidth="0.8"
                            opacity="0.3"
                        >
                            <animate
                                attributeName="r"
                                from={EARTH_R + 12}
                                to={EARTH_R + 24}
                                dur="2s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                from="0.4"
                                to="0"
                                dur="2s"
                                repeatCount="indefinite"
                            />
                        </circle>

                        {/* KSC launch pad marker */}
                        <circle
                            cx={WP[0].x}
                            cy={WP[0].y}
                            r="6"
                            fill="#fbbf24"
                            opacity="0.8"
                        >
                            <animate
                                attributeName="r"
                                values="5;8;5"
                                dur="1.5s"
                                repeatCount="indefinite"
                            />
                            <animate
                                attributeName="opacity"
                                values="0.8;0.3;0.8"
                                dur="1.5s"
                                repeatCount="indefinite"
                            />
                        </circle>
                        <text
                            x={WP[0].x + 12}
                            y={WP[0].y + 4}
                            fill="#fbbf24"
                            fontSize="9"
                            fontWeight="600"
                        >
                            LC-39B
                        </text>
                    </g>
                )}

                {/* ── Legend ────────────────────────────────────── */}
                {LEGEND.map((item, i) => {
                    const lx = 80 + i * 125;
                    return (
                        <g key={item.label}>
                            <circle cx={lx} cy={28} r="5" fill={item.color} />
                            <text
                                x={lx + 10}
                                y={32}
                                fill="#94a3b8"
                                fontSize="11"
                                fontWeight="500"
                            >
                                {item.label}
                            </text>
                        </g>
                    );
                })}

                {/* ── Footer ───────────────────────────────────── */}
                <text
                    x={W / 2}
                    y={H - 14}
                    textAnchor="middle"
                    fill="#475569"
                    fontSize="11"
                >
                    Artemis II — Free Return Trajectory
                </text>
            </svg>
        </div>
    );
}
