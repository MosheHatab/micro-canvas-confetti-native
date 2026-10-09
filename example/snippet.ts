import type { ConfettiDuration, ConfettiOptions, ConfettiPreset } from "micro-canvas-confetti-native";

import { demoCoinSource, renderDemoCoin, type DemoCoinId } from "./coins";
import { SVG_XML } from "./svgCoins";

/** Which control group is open. Custom still fires coin pieces. */
export type DemoCategory = "confetti" | "coin" | "custom";

/** Playground values the install snippet and the burst buttons share. */
export interface PlaygroundSettings {
	category: DemoCategory;
	coinId: DemoCoinId;
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

function usesCoins(settings: PlaygroundSettings): boolean {
	return settings.category !== "confetti";
}

function coinOptions(settings: PlaygroundSettings): ConfettiOptions {
	if (!usesCoins(settings)) return {};
	const renderCoin = renderDemoCoin(settings.coinId);
	if (renderCoin) return { appearance: "coin", renderCoin };
	if (settings.coinId === "h-keystone") return { appearance: "coin", coinType: "h-keystone" };
	const coinSource = demoCoinSource(settings.coinId);
	return coinSource ? { appearance: "coin", coinSource } : { appearance: "coin" };
}

/** Options passed to `confetti()`, without a tap origin. */
export function toConfettiOptions(settings: PlaygroundSettings): ConfettiOptions {
	return {
		...(settings.preset ? { preset: settings.preset } : {}),
		...coinOptions(settings),
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
	const lines = [
		...coinSnippet(settings),
		...Object.entries(options)
			.filter(([key, value]) => {
				if (value === undefined) return false;
				if (key === "appearance" || key === "coinType" || key === "coinSource" || key === "renderCoin") {
					return false;
				}
				if (key === "burstRadius" && value === 0) return false;
				if (key === "disableForReducedMotion" && value === true) return false;
				return true;
			})
			.map(([key, value]) => `  ${key}: ${typeof value === "string" ? `"${value}"` : String(value)},`),
	];

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

function coinSnippet(settings: PlaygroundSettings): string[] {
	if (!usesCoins(settings)) return [];
	if (settings.coinId === "custom" || settings.coinId in SVG_XML) {
		const body =
			settings.coinId === "custom"
				? `<View style={{ width: "100%", height: "100%", borderRadius: 999, backgroundColor: "#f5b301" }} />`
				: `<SvgXml xml={${settings.coinId}Svg} width="100%" height="100%" />`;
		return [`  appearance: "coin",`, `  renderCoin: () => (`, `    ${body}`, `  ),`];
	}
	if (settings.coinId === "h-keystone") return [`  appearance: "coin",`, `  coinType: "h-keystone",`];
	return [`  appearance: "coin",`, `  coinSource: require("./coins/${settings.coinId}.png"),`];
}

export { num };
