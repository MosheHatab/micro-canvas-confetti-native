/**
 * Publishes example/ as a JavaScript Expo Snack (types stripped).
 * Snack's editor typecheck rejects the TSX playground. The radial-chart Snack
 * is plain JS for the same reason. Save the printed URL over
 * @moshehat/micro-canvas-confetti-native to replace the short link.
 *
 * The library dependency is `latest`, so the Snack installs the newest
 * micro-canvas-confetti-native from npm each time it bundles.
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const exampleDir = fileURLToPath(new URL("../example/", import.meta.url));
const outDir = mkdtempSync(join(tmpdir(), "snack-js-"));
const sources = [
	["App.tsx", "App.js"],
	["coins.tsx", "coins.js"],
	["snippet.ts", "snippet.js"],
	["svgCoins.ts", "svgCoins.js"],
];

for (const [source, target] of sources) {
	execFileSync(
		"npx",
		[
			"--yes",
			"esbuild",
			join(exampleDir, source),
			`--outfile=${join(outDir, target)}`,
			"--jsx=preserve",
			"--format=esm",
			"--target=es2020",
		],
		{ stdio: "inherit", shell: true },
	);
}

const code = {};
for (const [, target] of sources) {
	code[target] = { type: "CODE", contents: readFileSync(join(outDir, target), "utf8") };
}

// Snack's asset CDN rejects inlined PNG bytes (it treats them as a URL and the
// preview hangs). Point the coin requires at data URIs instead.
const coinsDir = join(exampleDir, "assets", "coins");
let coinsSource = code["coins.js"].contents;
for (const file of readdirSync(coinsDir)) {
	if (!file.endsWith(".png")) continue;
	const base64 = readFileSync(join(coinsDir, file)).toString("base64");
	coinsSource = coinsSource.replaceAll(
		`require("./assets/coins/${file}")`,
		`{ uri: "data:image/png;base64,${base64}" }`,
	);
}
code["coins.js"].contents = coinsSource;

const response = await fetch("https://exp.host/--/api/v2/snack/save", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({
		manifest: {
			name: "micro-canvas-confetti-native",
			description: "Confetti and coin playground",
			sdkVersion: "52.0.0",
		},
		code,
		dependencies: {
			"micro-canvas-confetti-native": { version: "latest" },
			"expo-status-bar": { version: "~2.0.1" },
			"react-native-svg": { version: "15.8.0" },
		},
	}),
});
const payload = await response.json();
if (!response.ok) {
	console.error(payload);
	process.exit(1);
}
console.log(`https://snack.expo.dev/${payload.hashId}`);
