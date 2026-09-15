/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  testRunner: 'jest',
  reporters: ['progress', 'clear-text', 'html'],
  coverageAnalysis: 'perTest',
  mutate: ['src/services/**/*.ts', 'src/utils/**/*.ts'],
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  thresholds: {
    high: 80,
    low: 65,
    break: 65,
  },
};
