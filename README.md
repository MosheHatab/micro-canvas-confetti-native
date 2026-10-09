# micro-canvas-confetti-native

**Confetti and coin bursts for React Native — Views and Image only, no extra native module.**

[![npm version](https://img.shields.io/npm/v/micro-canvas-confetti-native.svg)](https://www.npmjs.com/package/micro-canvas-confetti-native)
[![npm downloads](https://img.shields.io/npm/dm/micro-canvas-confetti-native.svg)](https://www.npmjs.com/package/micro-canvas-confetti-native)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/micro-canvas-confetti-native)](https://bundlephobia.com/package/micro-canvas-confetti-native)
[![CI](https://github.com/MosheHatab/micro-canvas-confetti-native/actions/workflows/ci.yml/badge.svg)](https://github.com/MosheHatab/micro-canvas-confetti-native/actions/workflows/ci.yml)
[![provenance](https://img.shields.io/npm/v/micro-canvas-confetti-native?label=provenance&logo=npm)](https://www.npmjs.com/package/micro-canvas-confetti-native#provenance)
[![types](https://img.shields.io/npm/types/micro-canvas-confetti-native.svg)](https://www.npmjs.com/package/micro-canvas-confetti-native)
[![license](https://img.shields.io/npm/l/micro-canvas-confetti-native.svg)](./LICENSE)

Confetti and coin bursts for React Native. Same presets and physics as [`micro-canvas-confetti-physics`](https://www.npmjs.com/package/micro-canvas-confetti-physics), plus image coins and a **collect** flight that starts big and shrinks into a label or box.

Drawn with `View` and `Image` only. Peers are `react` and `react-native`. No Skia, no Reanimated, no extra native module.

## Install

```sh
npm install micro-canvas-confetti-native
```

Mount one overlay at the root. It does not take touches.

```tsx
import { ParticleHost } from "micro-canvas-confetti-native";
import { View } from "react-native";

export function Root() {
  return (
    <View style={{ flex: 1 }}>
      <App />
      <ParticleHost />
    </View>
  );
}
```

## Quick start

```tsx
import { confetti, measureCenter } from "micro-canvas-confetti-native";
import { Circle, Svg } from "react-native-svg";

confetti();
confetti({ preset: "cannon", origin: { x: 180, y: 640 } });

// coinType omitted → h-keystone. Or pass your own PNG / SVG node.
confetti({ appearance: "coin", particleCount: 12, origin: { x: 200, y: 400 } });
confetti({
  appearance: "coin",
  particleCount: 12,
  coinSource: require("./coins/guess-and-draw.png"),
});
confetti({
  appearance: "coin",
  particleCount: 8,
  renderCoin: () => (
    <Svg width="100%" height="100%" viewBox="0 0 32 32">
      <Circle cx="16" cy="16" r="14" fill="#f5b301" />
    </Svg>
  ),
});

await confetti.collect({
  appearance: "coin",
  coinSource: require("./coins/stellar-gateway.png"),
  origin: { x: screenW / 2, y: screenH / 2 },
  target: await measureCenter(coinsLabelRef),
  particleCount: 8,
  onArrive: () => addCoin(),
});
```

`collect` flies pieces from `origin` to `target`. They start about 2.4× size, follow a short arc, and shrink to about 0.2× as they land. `target` is window coordinates. `measureCenter(ref)` reads a view with `measureInWindow` and returns its center. Pass `trackTarget: () => latestCenter` when that view can move, for example while the screen scrolls.

Calls made before `ParticleHost` mounts are queued.

## Coins

The library ships one built-in, `h-keystone` (`DEFAULT_COIN_TYPE`). Pass your own art per burst:

| Input | Use |
| --- | --- |
| `coinType` | Omit it, or `"h-keystone"` |
| `coinSource` | A PNG or WebP. Anything `<Image source>` accepts: `require("./coin.png")` or `{ uri }` |
| `renderCoin` | `(index) => ReactElement`. An SVG from `react-native-svg`, or any view you already render. This package does not parse SVG files |

`renderCoin` wins over `coinSource`, which wins over `coinType`. The node should fill the piece (`width` and `height` `"100%"`). The host moves one wrapper view per coin.

A shared PNG is decoded once. An SVG (or any custom tree) is copied once per coin, so keep that burst smaller when the graphic is heavy.

### Artwork that reads well

- PNG-24 or WebP, transparent, sRGB, square **256×256**
- Disc centered with about **8%** padding so rotation does not clip the edge
- Still readable at **~32dp** (the shrunk end) and **~96dp** (the big start)

## API

| Option | Burst default | Notes |
| --- | --- | --- |
| `appearance` | `"confetti"` | `"coin"` draws the coin image |
| `coinType` | `"h-keystone"` | Built-in coin. Ignored when `coinSource` or `renderCoin` is set |
| `coinSource` | — | Your PNG or WebP. Overrides `coinType` |
| `renderCoin` | — | `(index) => node`. Your SVG or view. Overrides `coinSource` |
| `particleCount` | 60 confetti / 12 coins | You choose the count. Each piece is a view, so a higher count costs more. Safety cap: **300** confetti and **150** coins. A higher request is clamped, and the library warns. |
| `origin` | center of the host | Window coordinates |
| `preset` | — | `celebration`, `subtle`, `cannon`, `spark` |
| `angle` | `270` | Degrees, up |
| `spread` | `45` | Cone in degrees |
| `startVelocity` | `45` | |
| `gravity` | `1.2` | |
| `drag` | `0.08` | |
| `duration` | `"normal"` | `short` \| `normal` \| `long` |
| `scalar` | `1` | Size, `0.2`–`3` |
| `burstRadius` | `0` | Max distance from origin. `0` = no limit |
| `colors` / `shapes` | festive palette, rect + circle | Confetti only |
| `disableForReducedMotion` | `true` | No-op when the OS reduce-motion setting is on |

Collect-only: `target` (required), `flightMs` (900), `staggerMs` (60), `onArrive(index, total)`.

- `confetti(options?)` → `{ reset, isActive }`
- `confetti.promise(options?)` → resolves when that burst is gone
- `confetti.collect(options)` → resolves when every piece has landed
- `confettiSequence(steps)` (alias `sequence`) → `{ cancel, promise }`
- `reset()` — clear the screen
- `getActiveParticleCount()`
- `measureCenter(ref)` → `Promise<{ x, y }>`

## What stays on the web package

Canvas snapshot, motion trails, and the velocity heatmap. Those need a canvas. This package draws each piece as a view, so `particleCount` is yours up to the safety cap (300 confetti, 150 coins).

## Demo

The full playground (presets, coin types, collect-into-a-badge) is in [`example/`](./example):

```sh
cd example
npm install
npm run start        # press a / i / w for Android / iOS / web
```

Hosted playground on [**Expo Snack**](https://snack.expo.dev/FgnE4CaGzizFVtduONh0j) — runs in the browser and on a phone via QR. It installs `micro-canvas-confetti-native` from npm. Snack is the right host for this demo: Vercel would only serve the web export, and a phone QR is the useful check for a React Native overlay.

## Development

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Cloning this repo to publish your own package: [PUBLISHING.md](./PUBLISHING.md).

MIT © Moshe Hatab
