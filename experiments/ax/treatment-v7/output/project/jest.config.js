/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  // Integration tests share a single database — run suites sequentially (1 worker)
  // to prevent beforeEach cleanups in one suite from racing against DB state in another.
  maxWorkers: 1,
  // setupFiles runs before any module is imported — required so JWT_SECRET is set
  // before UserService module-level constants are evaluated
  setupFiles: ['<rootDir>/jest.setup.env.ts'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*.ts',
    '!src/server.ts',
    '!src/**/index.ts',
    // Prisma repository adapters require a live PostgreSQL connection —
    // they are covered by CI integration tests, not local unit tests.
    '!src/repositories/Prisma*.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov', 'html'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'CommonJS',
        },
      },
    ],
  },
};
