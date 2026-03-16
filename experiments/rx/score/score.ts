#!/usr/bin/env ts-node
// score.ts — derive per-property rubric scores from RX evidence artifacts
// Status: stub — implementation follows after runner produces first evidence run
//
// Usage:
//   npx ts-node score/score.ts \
//     --jest evidence/jest-output.json \
//     --build evidence/build-log.txt \
//     --rubric score/rubric.json \
//     --output evidence/score.json

import * as fs from 'fs';
import * as path from 'path';

interface RubricProperty {
  id: string;
  name: string;
  maxScore: number;
  automatedGate?: boolean;
  evidenceArtifact?: string;
}

interface Rubric {
  properties: RubricProperty[];
  maxTotalScore: number;
  executableRequired: boolean;
}

interface JestOutput {
  numFailedTests: number;
  numPassedTests: number;
  numTotalTests: number;
  numFailedTestSuites: number;
  success: boolean;
}

interface ScoreResult {
  runDate: string;
  rubricVersion: string;
  properties: Array<{ id: string; name: string; score: number; maxScore: number; automated: boolean }>;
  totalScore: number;
  maxTotalScore: number;
  executablePassed: boolean;
  passed: boolean;
}

function scoreExecutable(jestPath: string): { score: number; passed: boolean } {
  if (!fs.existsSync(jestPath)) {
    return { score: 0, passed: false };
  }
  const jest: JestOutput = JSON.parse(fs.readFileSync(jestPath, 'utf-8'));
  const passed = jest.success && jest.numFailedTests === 0;
  return { score: passed ? 2 : (jest.numPassedTests > 0 ? 1 : 0), passed };
}

function main(): void {
  // TODO: parse CLI args properly (use minimist or yargs when deps are available)
  const args = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
  };

  const jestPath = get('--jest') ?? 'evidence/jest-output.json';
  const rubricPath = get('--rubric') ?? 'score/rubric.json';
  const outputPath = get('--output') ?? 'evidence/score.json';

  const rubric: Rubric = JSON.parse(fs.readFileSync(rubricPath, 'utf-8'));
  const executableResult = scoreExecutable(jestPath);

  const propertyScores = rubric.properties.map((prop) => {
    if (prop.id === 'executable') {
      return { id: prop.id, name: prop.name, score: executableResult.score, maxScore: prop.maxScore, automated: true };
    }
    // Non-automated properties require manual scoring — stub at 0 until auditor fills in
    return { id: prop.id, name: prop.name, score: -1, maxScore: prop.maxScore, automated: false };
  });

  const automatedTotal = propertyScores
    .filter((p) => p.automated)
    .reduce((sum, p) => sum + p.score, 0);

  const result: ScoreResult = {
    runDate: new Date().toISOString(),
    rubricVersion: rubric.rubric ?? 'GS Unified Seven-Property Rubric (AX v5)',
    properties: propertyScores,
    totalScore: automatedTotal,
    maxTotalScore: rubric.maxTotalScore,
    executablePassed: executableResult.passed,
    passed: executableResult.passed,
  };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`[score] Executable: ${executableResult.passed ? 'PASS' : 'FAIL'} (${executableResult.score}/2)`);
  console.log(`[score] Automated score: ${automatedTotal}/${rubric.maxTotalScore}`);
  console.log(`[score] Non-automated properties marked -1 — require manual auditor scoring`);
  console.log(`[score] Written: ${outputPath}`);
}

main();
