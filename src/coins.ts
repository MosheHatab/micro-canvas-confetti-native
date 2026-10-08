import type { ImageSourcePropType } from "react-native";

import type { CoinType } from "./types";

/** Built-in coin artwork, 256×256 transparent PNGs. */
export const COIN_IMAGES: Record<CoinType, ImageSourcePropType> = {
	"h-keystone": require("./assets/coins/h-keystone.png"),
	"stellar-gateway": require("./assets/coins/stellar-gateway.png"),
	"explorer-command-crest": require("./assets/coins/explorer-command-crest.png"),
	"golden-thread": require("./assets/coins/golden-thread.png"),
	"mechanical-keyboard": require("./assets/coins/mechanical-keyboard.png"),
	oshik: require("./assets/coins/oshik.png"),
	"guess-and-draw": require("./assets/coins/guess-and-draw.png"),
};
