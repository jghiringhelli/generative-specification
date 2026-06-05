/**
 * Jest configuration (ESM + ts-jest).
 *
 * Runs under `node --experimental-vm-modules` (see the `test` npm script).
 * The moduleNameMapper strips the `.js` extension that NodeNext requires on
 * local imports so ts-jest can resolve the TypeScript sources.
 */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', { useESM: true }],
  },
  clearMocks: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/server.ts',
    // Prisma adapters are thin I/O verified by real-database integration tests
    // (gated on RUN_DB_TESTS); they cannot be exercised in the unit run, which
    // has no Postgres. Their behavioural contracts are covered identically by
    // the in-memory fakes under the same ports.
    '!src/adapters/persistence/PrismaUserRepository.ts',
    '!src/adapters/persistence/PrismaProfileRepository.ts',
    '!src/adapters/persistence/PrismaArticleRepository.ts',
    '!src/adapters/persistence/PrismaCommentRepository.ts',
  ],
  coverageDirectory: 'coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
