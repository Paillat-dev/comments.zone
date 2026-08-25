import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";
import prettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";

import svelteConfig from "./svelte.config.js";

export default defineConfig(
  { ignores: ["dist/", ".astro/", "node_modules/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  astro.configs.recommended,
  svelte.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".svelte"],
        svelteConfig,
      },
    },
  },
  prettier,
  svelte.configs.prettier,
);
