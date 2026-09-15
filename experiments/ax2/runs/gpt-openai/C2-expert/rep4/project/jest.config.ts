import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  clearMocks: true,
  coverageThreshold: {
    global: {
      lines: 80
    }
  }
};

export default config;
