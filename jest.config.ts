import type { JestConfigWithTsJest } from "ts-jest";

const config: JestConfigWithTsJest = {
  testMatch: ["**/tests/**/*.test.ts"],
  testEnvironment: "jsdom",
  setupFiles: ["./tests/helpers/setup.ts"],
  restoreMocks: true,

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
      {
        // Already type checked by tsc in lint
        diagnostics: false,
        // Jest needs --experimental-vm-modules to run ES modules, which are
        // emitted with the "type" field in package.json and tsconfig.json.
        tsconfig: {
          isolatedModules: true,
          module: "CommonJS",
          target: "ES2022",
        },
      },
    ],
  },
};
export default config;
