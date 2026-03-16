module.exports = {
  mutate: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.d.ts',
    '!src/index.ts'
  ],
  packageManager: 'npm',
  reporters: ['progress', 'clear-text', 'html'],
  testRunner: 'jest',
  coverageAnalysis: 'perTest',
  jest: {
    projectType: 'custom',
    configFile: 'jest.config.js',
    enableFindRelatedTests: true
  },
  thresholds: { high: 80, low: 60, break: 70 }
};
