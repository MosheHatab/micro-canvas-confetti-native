import { COIN_IMAGES, type RenderCoinFn } from "micro-canvas-confetti-native";
import { Image, View, type ImageSourcePropType } from "react-native";
import { SvgXml } from "react-native-svg";

import { SVG_XML, type SvgCoinId } from "./svgCoins";

/** Built-in and PNG coins shown under Coins. */
export const BUILTIN_COIN_IDS = [
	"h-keystone",
	"stellar-gateway",
	"explorer-command-crest",
	"golden-thread",
	"mechanical-keyboard",
	"guess-and-draw",
] as const;

/** Custom node and SVG examples shown under Custom. */
export const CUSTOM_COIN_IDS = ["custom", "alien", "heart", "smiley"] as const;

/** Demo-only art. The library ships `h-keystone`; everything else is passed in. */
export const DEMO_COIN_IDS = [...BUILTIN_COIN_IDS, ...CUSTOM_COIN_IDS] as const;

export type DemoCoinId = (typeof DEMO_COIN_IDS)[number];
export type CustomCoinId = (typeof CUSTOM_COIN_IDS)[number];

export function isCustomCoin(id: DemoCoinId): id is CustomCoinId {
	return (CUSTOM_COIN_IDS as readonly string[]).includes(id);
}

const BITMAPS = {
	"stellar-gateway": require("./assets/coins/stellar-gateway.png"),
	"explorer-command-crest": require("./assets/coins/explorer-command-crest.png"),
	"golden-thread": require("./assets/coins/golden-thread.png"),
	"mechanical-keyboard": require("./assets/coins/mechanical-keyboard.png"),
	"guess-and-draw": require("./assets/coins/guess-and-draw.png"),
} as const satisfies Record<string, ImageSourcePropType>;

type BitmapCoinId = keyof typeof BITMAPS;

function isBitmapCoin(id: DemoCoinId): id is BitmapCoinId {
	return id in BITMAPS;
}

function isSvgCoin(id: DemoCoinId): id is SvgCoinId {
	return id in SVG_XML;
}

/** Bitmap for a PNG coin. `null` for the custom node and the SVG examples. */
export function demoCoinSource(id: DemoCoinId): ImageSourcePropType | null {
	if (id === "h-keystone") return COIN_IMAGES["h-keystone"];
	if (isBitmapCoin(id)) return BITMAPS[id];
	return null;
}

/** Node the library moves. PNG coins use `coinSource` instead. */
export function renderDemoCoin(id: DemoCoinId): RenderCoinFn | undefined {
	if (id === "custom") {
		return () => (
			<View style={{ width: "100%", height: "100%", borderRadius: 999, backgroundColor: "#f5b301" }} />
		);
	}
	if (!isSvgCoin(id)) return undefined;
	const xml = SVG_XML[id];
	return () => <SvgXml xml={xml} width="100%" height="100%" />;
}

/** Chip and badge preview. */
export function DemoCoinGlyph({ id, size }: { id: DemoCoinId; size: number }) {
	if (isSvgCoin(id)) return <SvgXml xml={SVG_XML[id]} width={size} height={size} />;
	const source = demoCoinSource(id);
	if (source) return <Image source={source} style={{ width: size, height: size }} />;
	return (
		<View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#f5b301" }} />
	);
}
