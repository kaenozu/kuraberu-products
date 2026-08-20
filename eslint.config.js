import eslintPluginAstro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

const nodeGlobals = {
  AbortController: "readonly",
  clearTimeout: "readonly",
  console: "readonly",
  fetch: "readonly",
  process: "readonly",
  setTimeout: "readonly",
  URL: "readonly",
};

export default [
  {
    ignores: [
      "dist/**",
      ".astro/**",
      "node_modules/**",
      ".wrangler/**",
      "public/contact.js",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  {
    files: ["*.{js,mjs}", "scripts/**/*.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: nodeGlobals,
    },
    rules: {
      "no-constant-condition": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ["**/*.astro"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}", "**/*.astro"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
