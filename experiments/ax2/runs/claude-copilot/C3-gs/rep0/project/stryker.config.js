// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
module.exports = {
  packageManager: 'npm',
  testRunner: 'jest',
  reporters: ['clear-text', 'progress', 'html'],
  coverageAnalysis: 'perTest',
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  mutate: [
    'src/services/**/*.ts',
    'src/utils/**/*.ts',
    'src/errors/**/*.ts'
  ],
  thresholds: {
    high: 80,
    low: 70,
    break: 65
  }
};
