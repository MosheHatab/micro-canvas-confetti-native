import type { ImageSourcePropType } from "react-native";

import type { CoinType } from "./types";

/** Built-in coin artwork, 256×256 transparent PNGs. */
export const COIN_IMAGES: Record<CoinType, ImageSourcePropType> = {
	"h-keystone": require("./assets/coins/h-keystone.png"),
};
