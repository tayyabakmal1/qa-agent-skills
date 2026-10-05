#!/usr/bin/env node
/**
 * Vendor shared reference files into the skills that use them.
 *
 * Why this exists: `npx skills add` installs individual skill DIRECTORIES. A link
 * from skills/a/SKILL.md to ../../shared/x.md resolves to nothing once the skill is
 * installed, and the spec independently requires relative paths from the skill root
 * kept one level deep. So shared knowledge is written once in shared/references/ and
 * copied into each consuming skill's references/, with CI enforcing byte equality.
 *
 * Duplicated bytes on disk are not a DRY violation when there is exactly one editable
 * source and a machine enforces equality. A link that breaks for every installed user is.
 *
 * Usage:
 *   node scripts/sync-shared.mjs --check   # CI: fail if any copy is stale
 *   node scripts/sync-shared.mjs --write   # local: refresh every copy
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

/**
 * Which shared references each skill vendors.
 * Add a skill here when it links to a shared reference, then run --write.
 */
const VENDOR_MAP = {
  'evidence-standards.md': [
    'pr-risk-analyzer',
    'regression-selector',
    'test-code-reviewer',
    'release-readiness',
    'test-vacuity-verifier',
    'playwright-test-generator',
  ],
  'ui-test-design.md': [
    'playwright-test-generator',
  ],
  'risk-triggers.md': [
    'pr-risk-analyzer',
    'release-readiness',
  ],
};

const SHARED_DIR = join(process.cwd(), 'shared', 'references');
const SKILLS_DIR = join(process.cwd(), 'skills');

const BANNER_PREFIX = '<!-- VENDORED';

function banner(file) {
  return `${BANNER_PREFIX} from shared/references/${file} -- do not edit here.\n`
    + `     Edit the canonical copy, then run: node scripts/sync-shared.mjs --write -->\n\n`;
}

function expected(file) {
  return banner(file) + readFileSync(join(SHARED_DIR, file), 'utf8');
}

function main() {
  const args = process.argv.slice(2);
  const write = args.includes('--write');
  const check = args.includes('--check');

  if (!write && !check) {
    console.error('Usage: node scripts/sync-shared.mjs --check | --write');
    process.exit(2);
  }

  if (!existsSync(SHARED_DIR)) {
    console.log('No shared/references/ directory; nothing to sync.');
    process.exit(0);
  }

  // Every file in shared/references/ must appear in VENDOR_MAP, so a new shared
  // file cannot be silently orphaned.
  const onDisk = readdirSync(SHARED_DIR).filter((f) => f.endsWith('.md'));
  const problems = [];
  for (const f of onDisk) {
    if (!(f in VENDOR_MAP)) {
      problems.push(`shared/references/${f} is not listed in VENDOR_MAP in scripts/sync-shared.mjs`);
    }
  }
  for (const f of Object.keys(VENDOR_MAP)) {
    if (!onDisk.includes(f)) {
      problems.push(`VENDOR_MAP lists ${f}, which does not exist in shared/references/`);
    }
  }

  let synced = 0;
  let stale = 0;

  for (const [file, skills] of Object.entries(VENDOR_MAP)) {
    if (!existsSync(join(SHARED_DIR, file))) continue;
    const want = expected(file);

    for (const skill of skills) {
      const dest = join(SKILLS_DIR, skill, 'references', file);

      if (!existsSync(join(SKILLS_DIR, skill))) {
        problems.push(`VENDOR_MAP refers to skill "${skill}", which does not exist`);
        continue;
      }

      const current = existsSync(dest) ? readFileSync(dest, 'utf8') : null;
      if (current === want) {
        synced++;
        continue;
      }

      if (write) {
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, want);
        console.log(`  updated  skills/${skill}/references/${file}`);
        synced++;
      } else {
        stale++;
        console.log(`  STALE    skills/${skill}/references/${file}`);
      }
    }
  }

  for (const p of problems) console.log(`  ERROR    ${p}`);

  if (problems.length || stale) {
    if (stale) {
      console.log(`\n${stale} vendored copy/copies out of date. Run: node scripts/sync-shared.mjs --write`);
    }
    process.exit(1);
  }

  console.log(`\n${synced} vendored copy/copies in sync.`);
}

main();
