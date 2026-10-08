import type {
	CoinType,
	ConfettiDuration,
	ConfettiOptions,
	ConfettiPreset,
	ParticleAppearance,
} from "micro-canvas-confetti-native";

/** Playground values the install snippet and the burst buttons share. */
export interface PlaygroundSettings {
	appearance: ParticleAppearance;
	coinType: CoinType;
	preset: ConfettiPreset | null;
	particleCount: number;
	scalar: number;
	spread: number;
	startVelocity: number;
	gravity: number;
	duration: ConfettiDuration;
	burstRadius: number;
	disableForReducedMotion: boolean;
}

function num(value: number): string {
	return String(Math.round(value * 100) / 100);
}

/** Options passed to `confetti()`, without a tap origin. */
export function toConfettiOptions(settings: PlaygroundSettings): ConfettiOptions {
	return {
		...(settings.preset ? { preset: settings.preset } : {}),
		...(settings.appearance === "coin"
			? { appearance: "coin" as const, coinType: settings.coinType }
			: {}),
		particleCount: settings.particleCount,
		duration: settings.duration,
		scalar: settings.scalar,
		spread: settings.spread,
		startVelocity: settings.startVelocity,
		gravity: settings.gravity,
		burstRadius: settings.burstRadius,
		disableForReducedMotion: settings.disableForReducedMotion,
	};
}

/** Install command plus a call that matches the current controls. */
export function formatSnippet(settings: PlaygroundSettings): { install: string; code: string } {
	const options = toConfettiOptions(settings);
	const lines = Object.entries(options)
		.filter(([key, value]) => {
			if (value === undefined) return false;
			if (key === "burstRadius" && value === 0) return false;
			if (key === "disableForReducedMotion" && value === true) return false;
			return true;
		})
		.map(([key, value]) => `  ${key}: ${typeof value === "string" ? `"${value}"` : String(value)},`);

	return {
		install: "npm install micro-canvas-confetti-native",
		code: [
			`import { confetti, ParticleHost } from "micro-canvas-confetti-native";`,
			``,
			`// Mount <ParticleHost /> once, as the last child of the app root.`,
			`confetti({`,
			...lines,
			`});`,
		].join("\n"),
	};
}

export { num };
