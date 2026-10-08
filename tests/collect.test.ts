import { describe, expect, it } from "vitest";

import { COLLECT_END_SCALE, COLLECT_START_SCALE } from "../src/constants";
import { sampleCollectPiece, spawnCollectPieces } from "../src/physics/collect";
import { parseCollectOptions } from "../src/utils/validation";

const CENTER = { x: 200, y: 400 };
const TARGET = { x: 360, y: 40 };

describe("parseCollectOptions", () => {
	it("requires a finite target", () => {
		expect(() => parseCollectOptions({} as never, CENTER)).toThrow(TypeError);
		expect(() => parseCollectOptions({ target: { x: Number.NaN, y: 0 } }, CENTER)).toThrow();
	});

	it("defaults origin to the host center and coin type to h-keystone", () => {
		const resolved = parseCollectOptions({ target: TARGET, appearance: "coin" }, CENTER);
		expect(resolved.origin).toEqual(CENTER);
		expect(resolved.coinType).toBe("h-keystone");
	});
});

describe("collect flight", () => {
	const resolved = parseCollectOptions(
		{ target: TARGET, appearance: "coin", particleCount: 6, flightMs: 800, staggerMs: 50 },
		CENTER,
	);
	const pieces = spawnCollectPieces(resolved);

	it("staggers pieces in launch order", () => {
		expect(pieces).toHaveLength(6);
		for (let i = 1; i < pieces.length; i++) {
			expect((pieces[i]?.delayMs ?? 0) >= (pieces[i - 1]?.delayMs ?? 0)).toBe(true);
		}
		expect(pieces[0]?.delayMs).toBe(0);
	});

	it("starts big near the origin and is hidden before its delay", () => {
		const piece = pieces[1];
		if (piece === undefined) throw new Error("no piece");
		const before = sampleCollectPiece(piece, piece.delayMs - 1);
		expect(before.opacity).toBe(0);
		const start = sampleCollectPiece(piece, piece.delayMs);
		expect(start.scale).toBeCloseTo(COLLECT_START_SCALE);
		expect(Math.hypot(start.x - CENTER.x, start.y - CENTER.y)).toBeLessThan(30);
	});

	it("lands small and faded on the target", () => {
		const piece = pieces[0];
		if (piece === undefined) throw new Error("no piece");
		const end = sampleCollectPiece(piece, piece.delayMs + piece.flightMs);
		expect(end.done).toBe(true);
		expect(end.x).toBeCloseTo(TARGET.x);
		expect(end.y).toBeCloseTo(TARGET.y);
		expect(end.scale).toBeCloseTo(COLLECT_END_SCALE);
		expect(end.opacity).toBe(0);
	});

	it("stays opaque mid-flight", () => {
		const piece = pieces[0];
		if (piece === undefined) throw new Error("no piece");
		const mid = sampleCollectPiece(piece, piece.flightMs / 2);
		expect(mid.opacity).toBe(1);
		expect(mid.done).toBe(false);
	});
});
