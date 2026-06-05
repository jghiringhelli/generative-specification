/**
 * Global test setup.
 *
 * Ensures any Prisma client opened during a test run is disconnected once the
 * suite completes, so the Node process exits cleanly and no connection leaks
 * between suites. Adapters register their client on `globalThis.__PRISMA__`.
 */
import { afterAll } from '@jest/globals';

interface Disconnectable {
  $disconnect(): Promise<void>;
}

afterAll(async (): Promise<void> => {
  const client = (globalThis as { __PRISMA__?: Disconnectable }).__PRISMA__;
  if (client) {
    await client.$disconnect();
  }
});
