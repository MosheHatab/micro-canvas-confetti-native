import { describe, expect, it, vi } from "vitest";

import { MAX_COIN_PIECES } from "../src/constants";
import { createBatch, ParticleEngine } from "../src/engine";

const BOUNDS = { x: 0, y: 0, width: 400, height: 800 };

function runUntilIdle(engine: ParticleEngine, maxFrames = 2000): number {
	let frames = 0;
	while (engine.step(1 / 60) && frames < maxFrames) frames += 1;
	return frames;
}

describe("ParticleEngine", () => {
	it("queues calls until a host attaches", () => {
		const engine = new ParticleEngine();
		engine.burst({ particleCount: 5 }, createBatch().batch);
		expect(engine.activeCount).toBe(0);
		const onChange = vi.fn();
		engine.attach(BOUNDS, onChange);
		expect(engine.activeCount).toBe(5);
		expect(onChange).toHaveBeenCalled();
	});

	it("resolves a burst promise once every piece is gone", async () => {
		const engine = new ParticleEngine();
		engine.attach(BOUNDS, () => undefined);
		const { batch, promise } = createBatch();
		engine.burst({ preset: "spark" }, batch);
		const frames = runUntilIdle(engine);
		expect(frames).toBeLessThan(2000);
		await expect(promise).resolves.toBeUndefined();
		expect(engine.clearIfIdle()).toBe(true);
		expect(engine.getSlots()).toHaveLength(0);
	});

	it("calls onArrive per piece and resolves a collect flight", async () => {
		const engine = new ParticleEngine();
		engine.attach(BOUNDS, () => undefined);
		const onArrive = vi.fn();
		const { batch, promise } = createBatch(onArrive);
		engine.collect(
			{ target: { x: 380, y: 20 }, appearance: "coin", particleCount: 4, flightMs: 300 },
			batch,
		);
		runUntilIdle(engine);
		await promise;
		expect(onArrive).toHaveBeenCalledTimes(4);
		expect(onArrive).toHaveBeenLastCalledWith(expect.any(Number), 4);
	});

	it("skips and resolves immediately under reduced motion", async () => {
		const engine = new ParticleEngine();
		engine.attach(BOUNDS, () => undefined);
		engine.setReducedMotion(true);
		const { batch, promise } = createBatch();
		engine.burst(undefined, batch);
		expect(engine.activeCount).toBe(0);
		await expect(promise).resolves.toBeUndefined();
	});

	it("caps coins on screen at the budget", () => {
		const engine = new ParticleEngine();
		engine.attach(BOUNDS, () => undefined);
		for (let i = 0; i < 5; i++) {
			engine.burst({ appearance: "coin", particleCount: 30 }, createBatch().batch);
		}
		expect(engine.activeCount).toBe(MAX_COIN_PIECES);
	});

	it("reset clears the screen and resolves pending promises", async () => {
		const engine = new ParticleEngine();
		engine.attach(BOUNDS, () => undefined);
		const { batch, promise } = createBatch();
		engine.burst(undefined, batch);
		engine.reset();
		expect(engine.activeCount).toBe(0);
		await expect(promise).resolves.toBeUndefined();
	});
});
