import { DEFAULT_FRAME_SECONDS, MAX_FRAME_SECONDS } from "../constants";

/** Clamps a number to the given range. */
export function clamp(value: number, min: number, max: number): number {
	if (value < min) return min;
	if (value > max) return max;
	return value;
}

/** Returns true when the value is a finite number. */
export function isFiniteNumber(value: unknown): value is number {
	return typeof value === "number" && Number.isFinite(value);
}

/** Converts degrees to radians. */
export function degreesToRadians(degrees: number): number {
	return (degrees * Math.PI) / 180;
}

/** Computes frame delta time in seconds, capped for stability. */
export function computeDeltaSeconds(lastTimestamp: number, timestamp: number): number {
	if (lastTimestamp <= 0) return DEFAULT_FRAME_SECONDS;
	return clamp((timestamp - lastTimestamp) / 1000, 0.001, MAX_FRAME_SECONDS);
}

/** Returns a random float between min and max, inclusive of min. */
export function randomInRange(min: number, max: number): number {
	return min + Math.random() * (max - min);
}

/** Picks a random item from a non-empty array. */
export function pickRandom<T>(items: readonly T[]): T {
	return items[Math.floor(Math.random() * items.length)] as T;
}

/** Linear interpolation from `a` to `b`. */
export function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

/** Ease-in-out cubic on 0–1. */
export function easeInOutCubic(t: number): number {
	return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

/** Ease-in quad on 0–1. */
export function easeInQuad(t: number): number {
	return t * t;
}
