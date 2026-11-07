// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files within the monorepo
config.watchFolders = [monorepoRoot];

// 2. Let Metro know where to resolve packages and in what order
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Resolve .js imports pointing to .ts source files in monorepo packages
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  try {
    return (defaultResolveRequest || context.resolveRequest)(
      context,
      moduleName,
      platform
    );
  } catch (error) {
    if (moduleName.endsWith(".js")) {
      const stripped = moduleName.slice(0, -3);
      try {
        return (defaultResolveRequest || context.resolveRequest)(
          context,
          stripped,
          platform
        );
      } catch {
        // continue to throw original
      }
    }
    throw error;
  }
};

module.exports = config;
