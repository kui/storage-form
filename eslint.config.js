import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

function ts(files, project) {
  return {
    files,
    extends: [
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: { parserOptions: { project } },
  };
}

export default defineConfig(
  globalIgnores(["js", "types", "docs"]),
  js.configs.recommended,
  ts(["*.ts", "tests/**/*.ts"], "./tsconfig.json"),
  ts(["ts/**/*.ts"], "./ts/tsconfig.json"),
  {
    files: ["*.config.{js,ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ["ts/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["tests/**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
      },
    },
  },
  eslintConfigPrettier,
);
