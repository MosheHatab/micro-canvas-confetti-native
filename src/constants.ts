import type {
	CoinType,
	ConfettiDuration,
	ConfettiOptions,
	ConfettiPreset,
	ParticleShape,
	PhysicsConfig,
} from "./types";

export const DEFAULT_PARTICLE_COUNT = 60;
export const DEFAULT_COIN_COUNT = 12;
export const MIN_PARTICLE_COUNT = 1;
/** On-screen budgets: every piece is a native view. */
export const MAX_CONFETTI_PIECES = 120;
export const MAX_COIN_PIECES = 40;

export const DEFAULT_ANGLE = 270;
export const DEFAULT_SPREAD = 45;
export const DEFAULT_START_VELOCITY = 45;
export const DEFAULT_GRAVITY = 1.2;
export const DEFAULT_DRAG = 0.08;
export const DEFAULT_DECAY = 0;
export const DEFAULT_SCALAR = 1;
export const MIN_SCALAR = 0.2;
export const MAX_SCALAR = 3;

export const ROTATION_DRAG = 0.12;
export const WOBBLE_DRAG = 0.1;
export const MIN_FLATNESS = 0.15;
export const SKEW_FACTOR = 0.3;

export const CULL_MARGIN = 50;
export const SETTLE_VELOCITY_THRESHOLD = 0.05;
export const SETTLE_Y_OFFSET = 50;

/**
 * The shared physics constants are tuned in small units; the host advances
 * the simulation this many seconds per real second so bursts read at phone scale.
 */
export const SIMULATION_TIME_SCALE = 12;
/** Longest frame step in seconds, so a dropped frame does not teleport pieces. */
export const MAX_FRAME_SECONDS = 0.05;
export const DEFAULT_FRAME_SECONDS = 1 / 60;

/** No limit — pieces can travel anywhere on screen. */
export const DEFAULT_BURST_RADIUS = 0;
export const MAX_BURST_RADIUS = 5000;

/** Lifespan in ticks when duration is set and ticks are not explicit. */
export const DURATION_TICKS: Record<ConfettiDuration, number> = {
	short: 45,
	normal: 0,
	long: 220,
};

/** Default drag per duration preset. */
export const DURATION_DRAG: Record<ConfettiDuration, number> = {
	short: 0.16,
	normal: DEFAULT_DRAG,
	long: 0.05,
};

/** Default size multiplier per duration preset. */
export const DURATION_SCALAR: Record<ConfettiDuration, number> = {
	short: 0.55,
	normal: 1,
	long: 1.15,
};

export const DEFAULT_COLORS: readonly string[] = [
	"#FF2D55",
	"#FFCC00",
	"#34C759",
	"#007AFF",
	"#AF52DE",
	"#FF9500",
	"#5AC8FA",
	"#FF6B9D",
];

export const CELEBRATION_COLORS = [
	"#FFD700",
	"#FF2D55",
	"#FF1493",
	"#00E5FF",
	"#39FF14",
	"#FF9500",
	"#BF5AF2",
] as const;
export const SUBTLE_COLORS = ["#B8C5D6", "#D4A5A5", "#A8D8EA", "#C9B1FF"] as const;
export const CANNON_COLORS = ["#FF4500", "#FFA500", "#FFFF00", "#FF2D55", "#FF6347"] as const;
export const SPARK_COLORS = ["#FFFFFF", "#FFFACD", "#FFE4E1", "#E0FFFF"] as const;

export const DEFAULT_SHAPES: readonly ParticleShape[] = ["rect", "circle"];

/** Confetti piece size range in dp before `scalar`. */
export const CONFETTI_WIDTH_RANGE = [6, 12] as const;
export const CONFETTI_HEIGHT_RANGE = [4, 10] as const;

export const COIN_TYPES: readonly CoinType[] = [
	"h-keystone",
	"stellar-gateway",
	"explorer-command-crest",
	"golden-thread",
	"mechanical-keyboard",
	"oshik",
	"guess-and-draw",
];
export const DEFAULT_COIN_TYPE: CoinType = "h-keystone";
/** Coin edge length in dp before `scalar`. */
export const COIN_SIZE = 40;
/** Coins spin in-plane slower than paper confetti. */
export const COIN_ROTATION_FACTOR = 0.25;

/** Collect flight: average ms per piece and the random spread around it. */
export const DEFAULT_COLLECT_FLIGHT_MS = 900;
export const COLLECT_FLIGHT_JITTER_MS = 200;
export const DEFAULT_COLLECT_STAGGER_MS = 60;
export const COLLECT_STAGGER_JITTER_MS = 20;
export const MAX_COLLECT_FLIGHT_MS = 5000;
export const MAX_COLLECT_STAGGER_MS = 1000;
/** Scale at launch and at the target, relative to the piece size. */
export const COLLECT_START_SCALE = 2.4;
export const COLLECT_END_SCALE = 0.2;
/** Fraction of the flight after which pieces fade out. */
export const COLLECT_FADE_START = 0.85;
/** Pieces start scattered this far (dp) around the origin. */
export const COLLECT_ORIGIN_SCATTER = 24;
/** How far the arc bows sideways, as a fraction of the flight distance. */
export const COLLECT_ARC_BEND = 0.35;
/** Coin spin speed in radians per second during a collect flight. */
export const COLLECT_SPIN_RANGE = [6, 10] as const;

/** Baseline simulation values used when options are resolved. */
export const DEFAULT_PHYSICS: PhysicsConfig = {
	gravity: DEFAULT_GRAVITY,
	drag: DEFAULT_DRAG,
	rotationDrag: ROTATION_DRAG,
	wobbleDrag: WOBBLE_DRAG,
	minFlatness: MIN_FLATNESS,
	skewFactor: SKEW_FACTOR,
	decay: DEFAULT_DECAY,
};

/** Default option overrides for each named preset. */
export const PRESET_OPTIONS: Record<ConfettiPreset, Partial<ConfettiOptions>> = {
	celebration: {
		particleCount: 150,
		startVelocity: 62,
		spread: 85,
		gravity: 0.9,
		duration: "normal",
		scalar: 1.15,
		colors: CELEBRATION_COLORS,
		shapes: ["rect", "circle"],
	},
	subtle: {
		particleCount: 14,
		startVelocity: 16,
		spread: 22,
		gravity: 0.55,
		duration: "short",
		scalar: 0.6,
		drag: 0.14,
		colors: SUBTLE_COLORS,
		shapes: ["circle"],
	},
	cannon: {
		particleCount: 55,
		startVelocity: 88,
		spread: 14,
		gravity: 2.2,
		duration: "short",
		scalar: 1,
		angle: 270,
		colors: CANNON_COLORS,
		shapes: ["rect"],
	},
	spark: {
		particleCount: 8,
		startVelocity: 22,
		spread: 360,
		gravity: 0.4,
		duration: "short",
		scalar: 0.45,
		drag: 0.2,
		decay: 0.08,
		burstRadius: 80,
		colors: SPARK_COLORS,
		shapes: ["circle"],
	},
};
