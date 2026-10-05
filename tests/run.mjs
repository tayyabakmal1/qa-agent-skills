#!/usr/bin/env node
/**
 * Tests for scripts/validate-skills.mjs.
 *
 * The validator is the only real code in this repo and it is the gate every
 * contribution passes through, so it needs tests more than anything else here.
 *
 * Each directory under tests/fixtures/ is a miniature skills tree. Its EXPECT file
 * lists substrings that MUST appear in the validator's errors -- one per line.
 * An empty EXPECT means the fixture must validate cleanly.
 *
 * Usage: node tests/run.mjs
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const FIXTURES = join(ROOT, 'tests', 'fixtures');

function runValidator(target) {
  try {
    const out = execFileSync(
      process.execPath,
      [join('scripts', 'validate-skills.mjs'), target, '--json'],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return JSON.parse(out);
  } catch (err) {
    // Non-zero exit is expected whenever a fixture has errors; stdout still holds JSON.
    if (err.stdout) {
      try {
        return JSON.parse(err.stdout);
      } catch {
        throw new Error(`validator produced unparseable output:\n${err.stdout}\n${err.stderr ?? ''}`);
      }
    }
    throw err;
  }
}

function allErrors(result) {
  return [...result.skills.flatMap((s) => s.errors), ...result.repoErrors];
}

let passed = 0;
const failures = [];

const cases = readdirSync(FIXTURES, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
  .map((e) => e.name)
  .sort();

if (cases.length === 0) {
  console.error('No fixtures found under tests/fixtures/');
  process.exit(2);
}

for (const name of cases) {
  const dir = join(FIXTURES, name);
  const expectPath = join(dir, 'EXPECT');
  if (!existsSync(expectPath)) {
    failures.push(`${name}: missing EXPECT file`);
    continue;
  }

  const expected = readFileSync(expectPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let result;
  try {
    result = runValidator(join('tests', 'fixtures', name));
  } catch (err) {
    failures.push(`${name}: validator crashed -- ${err.message}`);
    continue;
  }

  const errors = allErrors(result);

  if (expected.length === 0) {
    if (errors.length === 0) {
      console.log(`  ok    ${name} (validates cleanly)`);
      passed++;
    } else {
      failures.push(`${name}: expected no errors, got:\n        - ${errors.join('\n        - ')}`);
    }
    continue;
  }

  const missing = expected.filter((substr) => !errors.some((e) => e.includes(substr)));

  if (missing.length === 0) {
    console.log(`  ok    ${name} (rejected: "${expected[0]}")`);
    passed++;
  } else {
    failures.push(
      `${name}: validator did not report ${missing.map((m) => `"${m}"`).join(', ')}\n`
      + `        actual errors:\n        - ${errors.join('\n        - ') || '(none)'}`
    );
  }
}

console.log('');
if (failures.length) {
  console.log(`${failures.length} failure(s):\n`);
  for (const f of failures) console.log(`  FAIL  ${f}\n`);
  console.log(`${passed}/${cases.length} passed`);
  process.exit(1);
}

console.log(`${passed}/${cases.length} passed`);
