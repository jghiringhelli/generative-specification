import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import sonarjs from "eslint-plugin-sonarjs";

export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" }
    },
    plugins: { "@typescript-eslint": tseslint, sonarjs },
    rules: {
      "complexity": ["warn", 5],
      "sonarjs/cognitive-complexity": ["warn", 10],
      "sonarjs/no-duplicate-string": "warn",
      "sonarjs/no-identical-functions": "warn",
      "sonarjs/no-collapsible-if": "warn"
    }
  }
];
