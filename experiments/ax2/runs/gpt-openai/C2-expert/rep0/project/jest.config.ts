import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  coverageThreshold: {
    global: {
      lines: 80
    }
  }
};

export default config;
