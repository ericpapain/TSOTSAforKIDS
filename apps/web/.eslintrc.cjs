module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs", "coverage", "playwright-report"],
  parser: "@typescript-eslint/parser",
  plugins: ["react", "i18next"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
  },
  overrides: [
    {
      files: ["src/**/*.tsx"],
      excludedFiles: ["src/**/__tests__/**", "src/**/*.test.tsx", "src/**/*.spec.tsx"],
      rules: {
        "i18next/no-literal-string": [
          "error",
          {
            markupOnly: true,
          },
        ],
      },
    },
  ],
};
