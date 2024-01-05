import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  preset: "ts-jest/presets/default-esm",

  moduleNameMapper: {
    // Workaround:
    // ts-jest cannot import ts files with .js extension.
    // https://github.com/kulshekhar/ts-jest/issues/1057#issuecomment-1482644543
    // Or it seems good to use @swc/jest
    "^(\\.\\.?\\/.+)\\.js$": "$1",
  },

  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      // Already type checked by tsc in lint
      { diagnostics: false },
    ],
  },
};
export default config;
