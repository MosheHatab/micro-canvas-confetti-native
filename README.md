# micro-canvas-confetti-native

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

```ts
import { confetti, measureCenter } from "micro-canvas-confetti-native";

confetti();
confetti({ preset: "cannon", origin: { x: 180, y: 640 } });

// coinType omitted → h-keystone
confetti({ appearance: "coin", particleCount: 12, origin: { x: 200, y: 400 } });

await confetti.collect({
  appearance: "coin",
  coinType: "stellar-gateway",
  origin: { x: screenW / 2, y: screenH / 2 },
  target: await measureCenter(coinsLabelRef),
  particleCount: 8,
  onArrive: () => addCoin(),
});
```

`collect` flies pieces from `origin` to `target`. They start about 2.4× size, follow a short arc, and shrink to about 0.2× as they land. `target` is window coordinates. `measureCenter(ref)` reads a view with `measureInWindow` and returns its center.

Calls made before `ParticleHost` mounts are queued.

## Coin types

`coinType` is optional. The default is `h-keystone` (`DEFAULT_COIN_TYPE`). There is no `"generic"` id.

| `coinType` | Role |
| --- | --- |
| `h-keystone` | Default |
| `stellar-gateway` | |
| `explorer-command-crest` | |
| `golden-thread` | |
| `mechanical-keyboard` | |
| `oshik` | |
| `guess-and-draw` | |

Pass `coinSource` (anything `<Image source>` accepts) to draw your own sprite instead of a built-in.

### Replacing the artwork

Drop one PNG per type in `src/assets/coins/` before publish. The files shipped today are placeholders (except `mechanical-keyboard.png`, resized from the keyboard-game coin).

- PNG-24, transparent background, sRGB
- Square **256×256**
- Disc centered with about **8%** padding so rotation does not clip the edge
- Still readable at **~32dp** (the shrunk end) and **~96dp** (the big start)
- **Under ~40 KB** each
- Exact names: `h-keystone.png`, `stellar-gateway.png`, `explorer-command-crest.png`, `golden-thread.png`, `mechanical-keyboard.png`, `oshik.png`, `guess-and-draw.png`
- One file per type. The view scales it. No `@2x` / `@3x` set

All seven images ship in the npm package. That is most of the tarball. The JS stays small.

## API

| Option | Burst default | Notes |
| --- | --- | --- |
| `appearance` | `"confetti"` | `"coin"` draws the coin image |
| `coinType` | `"h-keystone"` | Ignored unless `appearance` is `"coin"` |
| `particleCount` | 60 confetti / 12 coins | Capped at **120** confetti and **40** coins |
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

Canvas snapshot, motion trails, the velocity heatmap, and bursts above 120 pieces. Those need a canvas. This package is the phone-sized version: rewards and celebrations, not 500 sprites.

## Demo

```sh
cd example
npm install
npm run start
```

## Development

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

MIT © Moshe Hatab
