# Demo — micro-canvas-confetti-native

Expo playground: tap the stage to burst, tune presets and physics, collect coins into the badge, and copy an install snippet that matches the controls. It imports the library from `../src`, so library edits hot-reload without a rebuild.

```sh
cd example
npm install
npm run start
```

`metro.config.js` watches the repo root and forces `react` and `react-native` to the example's copy. `babel.config.js` aliases the package name to `../src`.
