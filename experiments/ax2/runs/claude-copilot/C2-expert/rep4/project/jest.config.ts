import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/setup.ts"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/index.ts",
    "!src/tests/**",
  ],
  coverageThreshold: {
    global: {
      lines: 80,
    },
  },
};

export default config;
