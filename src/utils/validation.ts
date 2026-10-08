import {
	COIN_TYPES,
	DEFAULT_ANGLE,
	DEFAULT_BURST_RADIUS,
	DEFAULT_COIN_COUNT,
	DEFAULT_COIN_TYPE,
	DEFAULT_COLLECT_FLIGHT_MS,
	DEFAULT_COLLECT_STAGGER_MS,
	DEFAULT_COLORS,
	DEFAULT_DECAY,
	DEFAULT_GRAVITY,
	DEFAULT_PARTICLE_COUNT,
	DEFAULT_PHYSICS,
	DEFAULT_SCALAR,
	DEFAULT_SHAPES,
	DEFAULT_SPREAD,
	DEFAULT_START_VELOCITY,
	DURATION_DRAG,
	DURATION_SCALAR,
	DURATION_TICKS,
	MAX_BURST_RADIUS,
	MAX_COIN_PIECES,
	MAX_COLLECT_FLIGHT_MS,
	MAX_COLLECT_STAGGER_MS,
	MAX_CONFETTI_PIECES,
	MAX_SCALAR,
	MIN_PARTICLE_COUNT,
	MIN_SCALAR,
	PRESET_OPTIONS,
} from "../constants";
import type {
	AppearanceOptions,
	CoinType,
	CollectOptions,
	ConfettiDuration,
	ConfettiOptions,
	ConfettiOrigin,
	ParticleAppearance,
	ParticleShape,
	ResolvedAppearance,
	ResolvedCollectOptions,
	ResolvedConfettiOptions,
} from "../types";
import { clamp, isFiniteNumber } from "./math";

const HEX_OR_FUNCTION_COLOR = /^(#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})|(rgb|rgba|hsl|hsla)\(.+\))$/i;

/** Accepts hex and rgb/hsl colors; React Native also takes named colors. */
function isValidColor(color: unknown): color is string {
	return typeof color === "string" && color.length > 0 && (HEX_OR_FUNCTION_COLOR.test(color) || /^[a-z]+$/i.test(color));
}

function isValidPoint(point: ConfettiOrigin | undefined): point is ConfettiOrigin {
	return point !== undefined && isFiniteNumber(point.x) && isFiniteNumber(point.y);
}

function resolveOrigin(origin: ConfettiOrigin | undefined, fallback: ConfettiOrigin): ConfettiOrigin {
	return isValidPoint(origin) ? origin : fallback;
}

function resolveColors(colors: readonly string[] | undefined): readonly string[] {
	const valid = (colors ?? []).filter(isValidColor);
	return valid.length > 0 ? valid : DEFAULT_COLORS;
}

function resolveShapes(shapes: readonly ParticleShape[] | undefined): readonly ParticleShape[] {
	const valid = (shapes ?? []).filter((s) => s === "rect" || s === "circle");
	return valid.length > 0 ? valid : DEFAULT_SHAPES;
}

function resolveAppearanceKind(value: unknown): ParticleAppearance {
	return value === "coin" ? "coin" : "confetti";
}

/** Unknown or missing coin types use the default `h-keystone`. */
export function resolveCoinType(value: unknown): CoinType {
	return COIN_TYPES.includes(value as CoinType) ? (value as CoinType) : DEFAULT_COIN_TYPE;
}

function resolveDuration(value: unknown): ConfettiDuration {
	if (value === "short" || value === "normal" || value === "long") return value;
	return "normal";
}

/** Safety ceiling for one look. The caller chooses the count up to this. */
export function pieceCeiling(appearance: ParticleAppearance): number {
	return appearance === "coin" ? MAX_COIN_PIECES : MAX_CONFETTI_PIECES;
}

function warnBudget(message: string): void {
	console.warn(`micro-canvas-confetti-native: ${message}`);
}

/** Count clamped to the safety ceiling. Warns when the caller asks for more. */
function resolveCount(value: unknown, appearance: ParticleAppearance): number {
	const isCoin = appearance === "coin";
	const max = pieceCeiling(appearance);
	if (!isFiniteNumber(value)) return isCoin ? DEFAULT_COIN_COUNT : DEFAULT_PARTICLE_COUNT;
	const requested = Math.round(value);
	if (requested > max) {
		const label = isCoin ? "coins" : "confetti";
		warnBudget(
			`particleCount ${requested} is above the ${label} safety cap of ${max}. Each piece is a view, so the count was clamped. Higher counts increase load.`,
		);
	}
	return clamp(requested, MIN_PARTICLE_COUNT, max);
}

/** Warns when a burst is cut because the screen is already at the ceiling. */
export function warnIfScreenCapped(
	appearance: ParticleAppearance,
	requested: number,
	spawned: number,
): void {
	if (spawned >= requested) return;
	const label = appearance === "coin" ? "coins" : "confetti";
	const max = pieceCeiling(appearance);
	warnBudget(
		`${label} safety cap is ${max} views on screen. Spawned ${spawned} of ${requested}. Wait for pieces to leave.`,
	);
}

function resolveAppearance(options: AppearanceOptions, defaultScalar: number): ResolvedAppearance {
	return {
		appearance: resolveAppearanceKind(options.appearance),
		coinType: resolveCoinType(options.coinType),
		...(options.coinSource !== undefined ? { coinSource: options.coinSource } : {}),
		colors: resolveColors(options.colors),
		shapes: resolveShapes(options.shapes),
		scalar: isFiniteNumber(options.scalar)
			? clamp(options.scalar, MIN_SCALAR, MAX_SCALAR)
			: defaultScalar,
		disableForReducedMotion: options.disableForReducedMotion !== false,
	};
}

/**
 * Validates burst options, merges presets, and returns a fully resolved config.
 * `defaultOrigin` is used when `origin` is missing (the host passes its center).
 */
export function parseConfettiOptions(
	options: ConfettiOptions | undefined,
	defaultOrigin: ConfettiOrigin,
): ResolvedConfettiOptions {
	const preset = options?.preset ? PRESET_OPTIONS[options.preset] : {};
	const merged: ConfettiOptions = { ...preset, ...options };

	const duration = resolveDuration(merged.duration);
	const look = resolveAppearance(merged, DURATION_SCALAR[duration]);
	const gravity = isFiniteNumber(merged.gravity) ? clamp(merged.gravity, 0, 5) : DEFAULT_GRAVITY;
	const drag = isFiniteNumber(merged.drag) ? clamp(merged.drag, 0, 1) : DURATION_DRAG[duration];
	const decay = isFiniteNumber(merged.decay) ? clamp(merged.decay, 0, 1) : DEFAULT_DECAY;
	const explicitTicks = isFiniteNumber(merged.ticks) ? Math.max(0, Math.round(merged.ticks)) : 0;

	return {
		...look,
		particleCount: resolveCount(merged.particleCount, look.appearance),
		origin: resolveOrigin(merged.origin, defaultOrigin),
		angle: isFiniteNumber(merged.angle) ? merged.angle : DEFAULT_ANGLE,
		spread: isFiniteNumber(merged.spread) ? clamp(merged.spread, 0, 360) : DEFAULT_SPREAD,
		startVelocity: isFiniteNumber(merged.startVelocity)
			? clamp(merged.startVelocity, 0, 200)
			: DEFAULT_START_VELOCITY,
		gravity,
		drag,
		decay,
		duration,
		rotationSpeed: isFiniteNumber(merged.rotationSpeed) ? clamp(merged.rotationSpeed, 0, 10) : 1,
		wobbleSpeed: isFiniteNumber(merged.wobbleSpeed) ? clamp(merged.wobbleSpeed, 0, 10) : 1,
		ticks: explicitTicks > 0 ? explicitTicks : DURATION_TICKS[duration],
		burstRadius: isFiniteNumber(merged.burstRadius)
			? clamp(merged.burstRadius, 0, MAX_BURST_RADIUS)
			: DEFAULT_BURST_RADIUS,
		physics: { ...DEFAULT_PHYSICS, gravity, drag, decay },
		...(merged.createParticle ? { createParticle: merged.createParticle } : {}),
	};
}

/** Validates collect options. Throws when `target` is missing or not finite. */
export function parseCollectOptions(
	options: CollectOptions,
	defaultOrigin: ConfettiOrigin,
): ResolvedCollectOptions {
	if (!isValidPoint(options?.target)) {
		throw new TypeError("confetti.collect: `target` must be a { x, y } point with finite numbers.");
	}
	const look = resolveAppearance(options, DEFAULT_SCALAR);
	return {
		...look,
		particleCount: resolveCount(options.particleCount, look.appearance),
		origin: resolveOrigin(options.origin, defaultOrigin),
		target: options.target,
		flightMs: isFiniteNumber(options.flightMs)
			? clamp(options.flightMs, 1, MAX_COLLECT_FLIGHT_MS)
			: DEFAULT_COLLECT_FLIGHT_MS,
		staggerMs: isFiniteNumber(options.staggerMs)
			? clamp(options.staggerMs, 0, MAX_COLLECT_STAGGER_MS)
			: DEFAULT_COLLECT_STAGGER_MS,
		...(options.onArrive ? { onArrive: options.onArrive } : {}),
	};
}
