import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  collectCoverageFrom: ["src/**/*.ts"],
  coverageThreshold: {
    global: {
      lines: 80
    }
  }
};

export default config;
