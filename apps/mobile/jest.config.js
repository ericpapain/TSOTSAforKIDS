module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!(\\.pnpm/)?((jest-)?react-native|@react-native(-community)?|@react-native/.*|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@tsotsa/.*))",
  ],
  setupFilesAfterEnv: ["<rootDir>/tests/jest.setup.js"],
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/*.test.[jt]s?(x)"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "src/api/**/*.{ts,tsx}",
    "src/offline/**/*.{ts,tsx}",
    "src/notifications/**/*.{ts,tsx}",
    "src/features/intakes/**/*.{ts,tsx}",
    "src/features/notifications/**/*.{ts,tsx}",
    "!src/components/**/__tests__/**",
    "!src/components/**/index.ts",
    "!src/api/**/index.ts",
    "!src/offline/**/__tests__/**",
    "!src/offline/**/index.ts",
    "!src/notifications/**/__tests__/**",
    "!src/notifications/**/index.ts",
    "!src/features/intakes/**/__tests__/**",
    "!src/features/intakes/**/index.ts",
    "!src/features/notifications/**/__tests__/**",
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
};

