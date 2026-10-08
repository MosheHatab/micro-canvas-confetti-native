import type { ConfettiOptions, ConfettiSequenceHandle, ConfettiSequenceStep } from "./types";

type BurstFn = (options?: ConfettiOptions) => unknown;

/** Builds a sequence runner that schedules bursts through the given trigger function. */
export function createSequenceRunner(
	burst: BurstFn,
): (steps: readonly ConfettiSequenceStep[]) => ConfettiSequenceHandle {
	return (steps) => {
		const timers: ReturnType<typeof setTimeout>[] = [];
		let cancelled = false;

		const promise = new Promise<void>((resolve) => {
			if (steps.length === 0) {
				resolve();
				return;
			}
			let completed = 0;
			for (const step of steps) {
				timers.push(
					setTimeout(() => {
						if (cancelled) return;
						burst(step.options);
						completed += 1;
						if (completed >= steps.length) resolve();
					}, step.delay),
				);
			}
		});

		return {
			cancel: () => {
				cancelled = true;
				for (const timer of timers) clearTimeout(timer);
			},
			promise,
		};
	};
}
