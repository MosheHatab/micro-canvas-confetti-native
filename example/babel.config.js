const path = require("path");

const pkg = require("../package.json");

/**
 * Resolve the library by its package name straight to its TypeScript source
 * (`../src`), so edits hot-reload without a build.
 */
module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		plugins: [
			[
				"module-resolver",
				{
					extensions: [".tsx", ".ts", ".js", ".jsx", ".json"],
					alias: {
						[pkg.name]: path.join(__dirname, "..", pkg.source),
					},
				},
			],
		],
	};
};
