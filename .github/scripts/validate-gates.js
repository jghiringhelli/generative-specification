#!/usr/bin/env node
/**
 * Validates quality gate YAML files against the schema.
 * Exit 0 = all valid, Exit 1 = validation errors found.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GATES_DIR = path.join(__dirname, '../../quality-gates/gates');

const REQUIRED_FIELDS = ['id', 'name', 'description', 'property', 'tags', 'phase', 'trigger', 'blocking', 'check'];

const VALID_PROPERTIES = ['Self-describing', 'Bounded', 'Verifiable', 'Defended', 'Auditable', 'Composable', 'Executable'];
const VALID_PHASES = ['development', 'staging', 'production'];
const VALID_TRIGGERS = ['commit', 'pr', 'release'];
const VALID_CHECK_TYPES = ['lint', 'test', 'script', 'audit', 'manual'];

let yaml;
try {
  yaml = require('js-yaml');
} catch {
  execSync('npm install js-yaml --no-save', { stdio: 'ignore' });
  yaml = require('js-yaml');
}

/**
 * Validates a single gate object parsed from YAML.
 * @param {string} file - Filename (for error messages)
 * @param {object} gate - Parsed gate object
 * @param {Map<string, string>} seenIds - Map of id -> filename for duplicate detection
 * @returns {string[]} Array of error messages
 */
function validateGate(file, gate, seenIds) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (gate[field] === undefined || gate[field] === null || gate[field] === '') {
      errors.push(`${file}: missing required field '${field}'`);
    }
  }

  if (gate.id) {
    if (seenIds.has(gate.id)) {
      errors.push(`${file}: duplicate id '${gate.id}' (also in ${seenIds.get(gate.id)})`);
    } else {
      seenIds.set(gate.id, file);
    }
  }

  if (gate.property && !VALID_PROPERTIES.includes(gate.property)) {
    errors.push(`${file}: invalid property '${gate.property}'. Must be one of: ${VALID_PROPERTIES.join(', ')}`);
  }

  if (gate.phase && !VALID_PHASES.includes(gate.phase)) {
    errors.push(`${file}: invalid phase '${gate.phase}'. Must be one of: ${VALID_PHASES.join(', ')}`);
  }

  if (gate.trigger && !VALID_TRIGGERS.includes(gate.trigger)) {
    errors.push(`${file}: invalid trigger '${gate.trigger}'. Must be one of: ${VALID_TRIGGERS.join(', ')}`);
  }

  if (gate.tags !== undefined && !Array.isArray(gate.tags)) {
    errors.push(`${file}: 'tags' must be an array`);
  }

  if (Array.isArray(gate.tags) && gate.tags.length === 0) {
    errors.push(`${file}: 'tags' must contain at least one entry`);
  }

  if (gate.check) {
    if (!gate.check.type) {
      errors.push(`${file}: check block must have 'type'`);
    } else if (!VALID_CHECK_TYPES.includes(gate.check.type)) {
      errors.push(`${file}: invalid check.type '${gate.check.type}'. Must be one of: ${VALID_CHECK_TYPES.join(', ')}`);
    }

    const requiresCommand = gate.check.type && gate.check.type !== 'manual';
    if (requiresCommand && !gate.check.command) {
      errors.push(`${file}: check.command is required when check.type is '${gate.check.type}'`);
    }
  }

  return errors;
}

const files = fs.readdirSync(GATES_DIR).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
const allErrors = [];
const seenIds = new Map();

for (const file of files) {
  const filePath = path.join(GATES_DIR, file);
  let gate;
  try {
    gate = yaml.load(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    allErrors.push(`${file}: YAML parse error — ${err.message}`);
    continue;
  }

  const fileErrors = validateGate(file, gate, seenIds);
  allErrors.push(...fileErrors);
}

if (allErrors.length > 0) {
  console.error('Gate validation failed:');
  allErrors.forEach(e => console.error(`  ✗ ${e}`));
  process.exit(1);
} else {
  console.log(`✓ All ${files.length} gates valid`);
  process.exit(0);
}
