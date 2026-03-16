
/**
 * Layer violation detector.
 * Scans route files for direct Prisma usage.
 */

import * as fs from 'fs';
import * as path from 'path';

const routesDir = path.join(__dirname, '../src/routes');

function auditRouteFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const violations: string[] = [];

  // Check for direct prisma usage
  if (content.includes('prisma.') || content.includes('new PrismaClient')) {
    violations.push(`${path.basename(filePath)}: Contains direct Prisma usage`);
  }

  // Check for repository imports (routes should not import repositories)
  if (
    content.includes("from '../repositories/Prisma") ||
    content.includes("from '../repositories/prisma")
  ) {
    violations.push(`${path.basename(filePath)}: Imports Prisma repository directly`);
  }

  return violations;
}

function auditLayers(): void {
  const violations: string[] = [];

  // Audit all route files
  const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'));

  for (const file of routeFiles) {
    const filePath = path.join(routesDir, file);
    const fileViolations = auditRouteFile(filePath);
    violations.push(...fileViolations);
  }

  if (violations.length === 0) {
    console.log('✅ Layer audit passed: No violations found');
    console.log('   All route handlers delegate to services');
    process.exit(0);
  } else {
    console.error('❌ Layer violations found:');
    violations.forEach((v) => console.error(`   ${v}`));
    process.exit(1);
  }
}

auditLayers();
