/**
 * Publish via changesets, but exit 0 when the current package.json version
 * is already on npm, so re-running the release on main does not fail with
 * "You cannot publish over the previously published versions".
 */
import { execSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

function publishedVersions(name) {
	try {
		const raw = execSync(`npm view ${name} versions --json`, {
			encoding: "utf8",
			stdio: ["ignore", "pipe", "pipe"],
		});
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [parsed];
	} catch {
		// Package has never been published (or registry unreachable) — proceed.
		return [];
	}
}

const versions = publishedVersions(pkg.name);
if (versions.includes(pkg.version)) {
	console.log(`✓ ${pkg.name}@${pkg.version} is already on npm — nothing to publish.`);
	process.exit(0);
}

execSync("npx changeset publish", { stdio: "inherit" });
