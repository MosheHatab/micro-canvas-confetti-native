import { describe, expect, it } from "vitest";

import {
	DEFAULT_COIN_COUNT,
	DEFAULT_PARTICLE_COUNT,
	MAX_COIN_PIECES,
	MAX_CONFETTI_PIECES,
} from "../src/constants";
import { applyDrag, applyDrag2D } from "../src/physics/drag";
import { integrateParticle, isParticleDead, spawnParticles } from "../src/physics/spawn";
import { computeWobbleScale } from "../src/physics/wobble";
import { parseConfettiOptions, resolveCoinType } from "../src/utils/validation";

const CENTER = { x: 200, y: 400 };
const VIEWPORT = { width: 400, height: 800 };

describe("parseConfettiOptions", () => {
	it("defaults to 60 confetti pieces at the given center", () => {
		const resolved = parseConfettiOptions(undefined, CENTER);
		expect(resolved.particleCount).toBe(DEFAULT_PARTICLE_COUNT);
		expect(resolved.origin).toEqual(CENTER);
		expect(resolved.appearance).toBe("confetti");
	});

	it("defaults coin bursts to 12 h-keystone coins", () => {
		const resolved = parseConfettiOptions({ appearance: "coin" }, CENTER);
		expect(resolved.particleCount).toBe(DEFAULT_COIN_COUNT);
		expect(resolved.coinType).toBe("h-keystone");
	});

	it("clamps counts to the view budgets", () => {
		expect(parseConfettiOptions({ particleCount: 999 }, CENTER).particleCount).toBe(
			MAX_CONFETTI_PIECES,
		);
		expect(
			parseConfettiOptions({ appearance: "coin", particleCount: 999 }, CENTER).particleCount,
		).toBe(MAX_COIN_PIECES);
	});

	it("merges presets under explicit options", () => {
		const resolved = parseConfettiOptions({ preset: "cannon", spread: 30 }, CENTER);
		expect(resolved.startVelocity).toBe(88);
		expect(resolved.spread).toBe(30);
	});

	it("drops invalid colors", () => {
		const resolved = parseConfettiOptions({ colors: ["", "#ff0000", "not a color!"] }, CENTER);
		expect(resolved.colors).toEqual(["#ff0000"]);
	});
});

describe("resolveCoinType", () => {
	it("keeps known types and falls back to h-keystone", () => {
		expect(resolveCoinType("oshik")).toBe("oshik");
		expect(resolveCoinType("generic")).toBe("h-keystone");
		expect(resolveCoinType(undefined)).toBe("h-keystone");
	});
});

describe("spawn + integrate", () => {
	it("spawns square coins with no initial rotation", () => {
		const resolved = parseConfettiOptions({ appearance: "coin", particleCount: 5 }, CENTER);
		const pieces = spawnParticles(resolved);
		expect(pieces).toHaveLength(5);
		for (const piece of pieces) {
			expect(piece.width).toBe(piece.height);
			expect(piece.rotation).toBe(0);
		}
	});

	it("moves pieces and applies gravity", () => {
		const resolved = parseConfettiOptions({ spread: 0, angle: 270 }, CENTER);
		const [piece] = spawnParticles(resolved);
		if (piece === undefined) throw new Error("no piece");
		const vy = piece.vy;
		integrateParticle(piece, 0.1, resolved.physics);
		expect(piece.y).toBeLessThan(CENTER.y);
		expect(piece.vy).toBeGreaterThan(vy * Math.exp(-resolved.physics.drag * 0.1) - 1e-9);
	});

	it("kills pieces past the burst radius", () => {
		const resolved = parseConfettiOptions({ burstRadius: 10 }, CENTER);
		const [piece] = spawnParticles(resolved);
		if (piece === undefined) throw new Error("no piece");
		piece.x = CENTER.x + 50;
		expect(isParticleDead(piece, VIEWPORT, CENTER.y)).toBe(true);
	});

	it("kills pieces that fall off screen", () => {
		const [piece] = spawnParticles(parseConfettiOptions(undefined, CENTER));
		if (piece === undefined) throw new Error("no piece");
		piece.y = VIEWPORT.height + 500;
		expect(isParticleDead(piece, VIEWPORT, CENTER.y)).toBe(true);
	});
});

describe("drag + wobble", () => {
	it("decays velocity exponentially", () => {
		expect(applyDrag(10, 1, 1)).toBeCloseTo(10 / Math.E);
		expect(applyDrag2D(10, -10, 0, 1)).toEqual({ vx: 10, vy: -10 });
	});

	it("never flattens below the minimum", () => {
		expect(computeWobbleScale(Math.PI / 2, 0.15)).toBe(0.15);
		expect(computeWobbleScale(0, 0.15)).toBe(1);
	});
});
