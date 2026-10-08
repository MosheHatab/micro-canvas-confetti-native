import {
	COIN_SIZE,
	COLLECT_ARC_BEND,
	COLLECT_END_SCALE,
	COLLECT_FADE_START,
	COLLECT_FLIGHT_JITTER_MS,
	COLLECT_ORIGIN_SCATTER,
	COLLECT_SPIN_RANGE,
	COLLECT_STAGGER_JITTER_MS,
	COLLECT_START_SCALE,
	CONFETTI_WIDTH_RANGE,
	MIN_FLATNESS,
} from "../constants";
import type { CollectFrame, CollectPiece, ConfettiOrigin, ResolvedCollectOptions } from "../types";
import { easeInOutCubic, easeInQuad, lerp, pickRandom, randomInRange } from "../utils/math";
import { computeWobbleScale } from "./wobble";

/** Creates the pieces of a collect flight from `origin` to `target`. */
export function spawnCollectPieces(options: ResolvedCollectOptions): CollectPiece[] {
	const { origin, target } = options;
	const dx = target.x - origin.x;
	const dy = target.y - origin.y;
	const distance = Math.hypot(dx, dy);
	// Unit normal to the flight line; arcs bow to either side of it.
	const normalX = distance > 0 ? -dy / distance : 0;
	const normalY = distance > 0 ? dx / distance : 0;
	const size =
		options.appearance === "coin"
			? COIN_SIZE * options.scalar
			: CONFETTI_WIDTH_RANGE[1] * options.scalar;

	const pieces: CollectPiece[] = [];
	let delayMs = 0;
	for (let i = 0; i < options.particleCount; i++) {
		const scatterAngle = randomInRange(0, Math.PI * 2);
		const scatter = randomInRange(0, COLLECT_ORIGIN_SCATTER);
		const startX = origin.x + Math.cos(scatterAngle) * scatter;
		const startY = origin.y + Math.sin(scatterAngle) * scatter;
		const bend = randomInRange(-COLLECT_ARC_BEND, COLLECT_ARC_BEND) * distance;

		pieces.push({
			startX,
			startY,
			controlX: (startX + target.x) / 2 + normalX * bend,
			controlY: (startY + target.y) / 2 + normalY * bend,
			endX: target.x,
			endY: target.y,
			delayMs,
			flightMs: Math.max(
				1,
				options.flightMs + randomInRange(-COLLECT_FLIGHT_JITTER_MS, COLLECT_FLIGHT_JITTER_MS),
			),
			size,
			color: pickRandom(options.colors),
			shape: pickRandom(options.shapes),
			wobblePhase: randomInRange(0, Math.PI * 2),
			wobbleSpeed: randomInRange(...COLLECT_SPIN_RANGE),
		});

		if (options.staggerMs > 0) {
			delayMs += Math.max(
				0,
				options.staggerMs + randomInRange(-COLLECT_STAGGER_JITTER_MS, COLLECT_STAGGER_JITTER_MS),
			);
		}
	}
	return pieces;
}

/** Point the rest of the flight at a new window position, keeping the arc shape. */
export function retargetCollectPiece(piece: CollectPiece, target: ConfettiOrigin): void {
	const dx = target.x - piece.endX;
	const dy = target.y - piece.endY;
	if (dx === 0 && dy === 0) return;
	piece.endX = target.x;
	piece.endY = target.y;
	piece.controlX += dx;
	piece.controlY += dy;
}

/** Position, size, and opacity of a collect piece `elapsedMs` after the flight started. */
export function sampleCollectPiece(piece: CollectPiece, elapsedMs: number): CollectFrame {
	const local = elapsedMs - piece.delayMs;
	const t = Math.min(1, Math.max(0, local / piece.flightMs));
	const path = easeInOutCubic(t);
	const inv = 1 - path;
	const x = inv * inv * piece.startX + 2 * inv * path * piece.controlX + path * path * piece.endX;
	const y = inv * inv * piece.startY + 2 * inv * path * piece.controlY + path * path * piece.endY;
	const fade = t <= COLLECT_FADE_START ? 1 : 1 - (t - COLLECT_FADE_START) / (1 - COLLECT_FADE_START);
	const spinSeconds = Math.max(0, local) / 1000;

	return {
		x,
		y,
		scale: lerp(COLLECT_START_SCALE, COLLECT_END_SCALE, easeInQuad(t)),
		scaleX: computeWobbleScale(piece.wobblePhase + piece.wobbleSpeed * spinSeconds, MIN_FLATNESS),
		opacity: local < 0 ? 0 : Math.max(0, fade),
		done: t >= 1,
	};
}
