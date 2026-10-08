# Demo — micro-canvas-confetti-native

Expo app: a confetti burst, a coin burst, and a collect flight into the coin badge. It imports the library from `../src`, so library edits hot-reload without a rebuild.

```sh
cd example
npm install
npm run start
```

`metro.config.js` watches the repo root and forces `react` and `react-native` to the example's copy. `babel.config.js` aliases the package name to `../src`.
