import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import parserTs from "@typescript-eslint/parser";
import pluginTs from "@typescript-eslint/eslint-plugin";
import globals from "globals";

const compat = new FlatCompat();

function ts(files, project) {
  return compat
    .extends(
      "plugin:@typescript-eslint/recommended-type-checked",
      "plugin:@typescript-eslint/stylistic-type-checked",
    )
    .map((config) => ({
      ...config,
      files,
      languageOptions: {
        parser: parserTs,
        parserOptions: {
          project,
        },
      },
      plugins: { "@typescript-eslint": pluginTs },
      rules: {
        ...config.rules,
        "@typescript-eslint/prefer-namespace-keyword": "off",
      },
    }));
}

export default [
  { ignores: ["dist", "lib", "docs"] },
  js.configs.recommended,
  eslintConfigPrettier,
  ...ts(["*.ts", "test/*.ts"], "./tsconfig.json"),
  ...ts(["src/**/*.ts"], "./src/tsconfig.json"),
  {
    files: ["*.config.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["test/**/*.test.ts"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
