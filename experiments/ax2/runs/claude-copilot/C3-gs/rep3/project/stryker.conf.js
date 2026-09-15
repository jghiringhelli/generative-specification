/**
 * @type {import('@stryker-mutator/api/core').PartialStrykerOptions}
 */
module.exports = {
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
  testRunner: 'jest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
  },
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  coverageAnalysis: 'perTest',
  mutate: ['src/services/**/*.ts', 'src/utils/**/*.ts'],
  thresholds: {
    high: 80,
    low: 65,
    break: 65,
  },
};
