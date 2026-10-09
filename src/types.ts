import type { ReactElement } from "react";

/** Shape drawn for a single confetti piece. */
export type ParticleShape = "rect" | "circle";

/** What each piece looks like: colored confetti or a coin image. */
export type ParticleAppearance = "confetti" | "coin";

/** Built-in coin artwork. Omit to use `h-keystone`, or pass your own image. */
export type CoinType = "h-keystone";

/**
 * One node per coin, called with the piece index when that piece is created.
 * Use this for an SVG the app already renders. The host moves a wrapper view;
 * the node should fill that box (`width` and `height` `"100%"`).
 */
export type RenderCoinFn = (index: number) => ReactElement;

/**
 * Image for a custom coin — anything React Native `<Image source>` accepts
 * (`require("./coin.png")`, `{ uri }`). Kept loose so the core stays RN-free.
 */
export type CoinSource = number | { readonly uri: string } | object;

/** Named burst style with tuned defaults. */
export type ConfettiPreset = "celebration" | "subtle" | "cannon" | "spark";

/** How long a burst stays visible before pieces fade out. */
export type ConfettiDuration = "short" | "normal" | "long";

/** Screen point in window coordinates (dp). */
export interface ConfettiOrigin {
	readonly x: number;
	readonly y: number;
}

/** Hook to override properties on a piece as it is created. */
export type CreateParticleFn = (
	index: number,
	defaults: Readonly<Partial<Particle>>,
) => Partial<Particle>;

/** Look of the pieces, shared by bursts and collect flights. */
export interface AppearanceOptions {
	/** `"confetti"` (default) or `"coin"`. */
	readonly appearance?: ParticleAppearance;
	/** Built-in coin. Defaults to `h-keystone`. Ignored when `coinSource` or `renderCoin` is set. */
	readonly coinType?: CoinType;
	/** Custom bitmap. Anything `<Image source>` accepts (PNG, WebP). Overrides `coinType`. */
	readonly coinSource?: CoinSource;
	/**
	 * Custom node per coin, for an SVG (or any view) the app owns.
	 * Overrides `coinSource`. A heavy tree copied once per coin costs more than one shared PNG.
	 */
	readonly renderCoin?: RenderCoinFn;
	readonly colors?: readonly string[];
	readonly shapes?: readonly ParticleShape[];
	/** Size multiplier (0.2–3). */
	readonly scalar?: number;
	/** Do nothing when the OS "Reduce Motion" setting is on. Default `true`. */
	readonly disableForReducedMotion?: boolean;
}

/** Options for a physics burst. */
export interface ConfettiOptions extends AppearanceOptions {
	readonly particleCount?: number;
	/** Defaults to the center of the host. */
	readonly origin?: ConfettiOrigin;
	readonly angle?: number;
	readonly spread?: number;
	readonly startVelocity?: number;
	readonly gravity?: number;
	readonly drag?: number;
	readonly decay?: number;
	readonly duration?: ConfettiDuration;
	readonly rotationSpeed?: number;
	readonly wobbleSpeed?: number;
	readonly ticks?: number;
	readonly preset?: ConfettiPreset;
	/** Max distance from the origin. 0 = no limit. */
	readonly burstRadius?: number;
	readonly createParticle?: CreateParticleFn;
}

/** Options for a collect flight: pieces start big at `origin` and shrink into `target`. */
export interface CollectOptions extends AppearanceOptions {
	/** Where pieces fly to, e.g. the center of a coins label (see `measureCenter`). */
	readonly target: ConfettiOrigin;
	/** Defaults to the center of the host. */
	readonly origin?: ConfettiOrigin;
	readonly particleCount?: number;
	/** Average flight time per piece in ms. */
	readonly flightMs?: number;
	/** Average delay between pieces in ms. */
	readonly staggerMs?: number;
	/** Called as each piece lands — handy for ticking a counter up. */
	readonly onArrive?: (index: number, total: number) => void;
	/**
	 * Read each frame so the flight follows a moving badge (scroll, layout).
	 * Return window coordinates. `target` is the starting aim.
	 */
	readonly trackTarget?: () => ConfettiOrigin | null;
}

/** A single burst piece and its motion state. */
export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	width: number;
	height: number;
	color: string;
	shape: ParticleShape;
	rotation: number;
	rotationSpeed: number;
	wobblePhase: number;
	wobbleSpeed: number;
	opacity: number;
	ticks: number;
	ticksMax: number;
	/** Burst origin used for reach-radius containment. */
	spawnX: number;
	spawnY: number;
	/** Max distance from spawn point. 0 = no limit. */
	burstRadius: number;
}

/** Internal simulation parameters used during integration. */
export interface PhysicsConfig {
	readonly gravity: number;
	readonly drag: number;
	readonly rotationDrag: number;
	readonly wobbleDrag: number;
	readonly minFlatness: number;
	readonly skewFactor: number;
	readonly decay: number;
}

/** Host size in dp. */
export interface Viewport {
	readonly width: number;
	readonly height: number;
}

/** Fully validated look, ready for spawn and render. */
export interface ResolvedAppearance {
	readonly appearance: ParticleAppearance;
	readonly coinType: CoinType;
	readonly coinSource?: CoinSource;
	readonly renderCoin?: RenderCoinFn;
	readonly colors: readonly string[];
	readonly shapes: readonly ParticleShape[];
	readonly scalar: number;
	readonly disableForReducedMotion: boolean;
}

/** Fully validated burst options ready for spawn and render. */
export interface ResolvedConfettiOptions extends ResolvedAppearance {
	readonly particleCount: number;
	readonly origin: ConfettiOrigin;
	readonly angle: number;
	readonly spread: number;
	readonly startVelocity: number;
	readonly gravity: number;
	readonly drag: number;
	readonly decay: number;
	readonly duration: ConfettiDuration;
	readonly rotationSpeed: number;
	readonly wobbleSpeed: number;
	readonly ticks: number;
	readonly burstRadius: number;
	readonly physics: PhysicsConfig;
	readonly createParticle?: CreateParticleFn;
}

/** Fully validated collect options. */
export interface ResolvedCollectOptions extends ResolvedAppearance {
	readonly particleCount: number;
	readonly origin: ConfettiOrigin;
	readonly target: ConfettiOrigin;
	readonly flightMs: number;
	readonly staggerMs: number;
	readonly onArrive?: (index: number, total: number) => void;
}

/** One piece of a collect flight along a quadratic bezier. */
export interface CollectPiece {
	readonly startX: number;
	readonly startY: number;
	controlX: number;
	controlY: number;
	endX: number;
	endY: number;
	/** ms after the flight starts before this piece moves. */
	readonly delayMs: number;
	readonly flightMs: number;
	readonly size: number;
	readonly color: string;
	readonly shape: ParticleShape;
	readonly wobblePhase: number;
	readonly wobbleSpeed: number;
}

/** Where a collect piece is drawn at one moment. */
export interface CollectFrame {
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly scaleX: number;
	readonly opacity: number;
	readonly done: boolean;
}

/** Handle returned from a burst, with reset and status helpers. */
export interface ConfettiHandle {
	readonly reset: () => void;
	readonly isActive: () => boolean;
}

/** Callable confetti API with promise and collect helpers attached. */
export type ConfettiFn = {
	(options?: ConfettiOptions): ConfettiHandle;
	promise(options?: ConfettiOptions): Promise<void>;
	collect(options: CollectOptions): Promise<void>;
};

/** One step in a timed sequence of bursts. */
export interface ConfettiSequenceStep {
	readonly delay: number;
	readonly options?: ConfettiOptions;
}

/** Handle for a running sequence — cancel early or await completion. */
export type ConfettiSequenceHandle = {
	readonly cancel: () => void;
	readonly promise: Promise<void>;
};

/** Runs bursts on a schedule. */
export type ConfettiSequenceFn = (
	steps: readonly ConfettiSequenceStep[],
) => ConfettiSequenceHandle;
