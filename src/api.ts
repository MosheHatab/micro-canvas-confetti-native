import { createBatch, ParticleEngine } from "./engine";
import { createSequenceRunner } from "./sequence";
import type {
	CollectOptions,
	ConfettiFn,
	ConfettiHandle,
	ConfettiOptions,
	ConfettiOrigin,
	ConfettiSequenceFn,
} from "./types";

/** Shared store the `ParticleHost` draws. One per app. */
export const engine = new ParticleEngine();

/** Stops every burst and flight, clears the screen, and resolves pending promises. */
export function reset(): void {
	engine.reset();
}

function launchBurst(options?: ConfettiOptions): { handle: ConfettiHandle; promise: Promise<void> } {
	const { batch, promise } = createBatch();
	engine.burst(options, batch);
	return {
		handle: { reset, isActive: () => batch.remaining !== 0 },
		promise,
	};
}

/** Flies pieces from `origin` into `target`, shrinking as they land. Resolves when all have landed. */
export function collect(options: CollectOptions): Promise<void> {
	const { batch, promise } = createBatch(options?.onArrive);
	try {
		engine.collect(options, batch);
	} catch (error) {
		return Promise.reject(error);
	}
	return promise;
}

/** Main API — trigger a burst, await it, or run a collect flight. */
export const confetti: ConfettiFn = Object.assign(
	(options?: ConfettiOptions): ConfettiHandle => launchBurst(options).handle,
	{
		promise: (options?: ConfettiOptions): Promise<void> => launchBurst(options).promise,
		collect,
	},
);

/** Fires a series of bursts on a timeline. Returns a handle to cancel or await. */
export const confettiSequence: ConfettiSequenceFn = createSequenceRunner(confetti);

/** Number of pieces currently on screen. */
export function getActiveParticleCount(): number {
	return engine.activeCount;
}

/** Anything with React Native's `measureInWindow` — a `View`, `Text`, or `Pressable` ref. */
export interface Measurable {
	measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

/**
 * Center of a mounted view in window coordinates — use it as a collect `target`
 * (or a burst `origin`). Accepts the ref object or the instance.
 */
export function measureCenter(
	ref: Measurable | { readonly current: Measurable | null } | null,
): Promise<ConfettiOrigin> {
	const node = ref !== null && "current" in ref ? ref.current : ref;
	if (node === null || typeof node.measureInWindow !== "function") {
		return Promise.reject(new TypeError("measureCenter: the ref is not attached to a view yet."));
	}
	return new Promise((resolve) => {
		node.measureInWindow((x, y, width, height) => {
			resolve({ x: x + width / 2, y: y + height / 2 });
		});
	});
}
