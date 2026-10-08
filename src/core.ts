/**
 * React-Native-free subpath: spawn, integrate, collect, and validation.
 * Safe to import in tests, workers, or a custom renderer.
 */
export {
	COIN_TYPES,
	DEFAULT_COIN_TYPE,
	DEFAULT_COLORS,
	DEFAULT_PHYSICS,
	PRESET_OPTIONS,
	SIMULATION_TIME_SCALE,
} from "./constants";
export { sampleCollectPiece,spawnCollectPieces } from "./physics/collect";
export { applyDrag, applyDrag2D } from "./physics/drag";
export { integrateParticle, isParticleDead, spawnParticles } from "./physics/spawn";
export { computeSkewX, computeWobbleScale } from "./physics/wobble";
export type * from "./types";
export { parseCollectOptions, parseConfettiOptions, resolveCoinType } from "./utils/validation";
