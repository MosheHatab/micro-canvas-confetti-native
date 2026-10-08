const path = require("path");

const { getDefaultConfig } = require("expo/metro-config");
const escape = require("escape-string-regexp");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const pkg = require("../package.json");

const root = path.resolve(__dirname, "..");

const config = getDefaultConfig(__dirname);

config.watchFolders = [root];

// One copy of React. On web, babel rewrites library `react-native` imports
// to `react-native-web`, which must also resolve to the example's copy.
const modules = [...Object.keys({ ...pkg.peerDependencies }), "react-native-web"];

config.resolver.blockList = exclusionList(
	modules.map((name) => new RegExp(`^${escape(path.join(root, "node_modules", name))}\\/.*$`)),
);

config.resolver.extraNodeModules = modules.reduce((acc, name) => {
	acc[name] = path.join(__dirname, "node_modules", name);
	return acc;
}, {});

module.exports = config;
