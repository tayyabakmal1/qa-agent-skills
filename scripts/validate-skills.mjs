#!/usr/bin/env node
/**
 * Validate every SKILL.md in this repo against the Agent Skills specification
 * (https://agentskills.io/specification) plus this repo's stricter house rules.
 *
 * Zero runtime dependencies, by design: the frontmatter subset used by SKILL.md
 * is flat scalars plus one optional string->string map, so a hand-rolled parser
 * covers it in ~150 lines AND can be stricter than a real YAML parser -- which
 * is exactly what a spec gate should be.
 *
 * Usage:
 *   node scripts/validate-skills.mjs            # validate ./skills
 *   node scripts/validate-skills.mjs <dir>      # validate a specific tree
 *   node scripts/validate-skills.mjs --json     # machine-readable output
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

// ---------------------------------------------------------------------------
// Spec constants. Changing these means the spec changed -- check the source.
// ---------------------------------------------------------------------------

/** The complete set of frontmatter fields the spec allows. Anything else is an error. */
const ALLOWED_FIELDS = new Set([
  'name',
  'description',
  'license',
  'compatibility',
  'metadata',
  'allowed-tools',
]);

const REQUIRED_FIELDS = ['name', 'description'];

const NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const COMPATIBILITY_MAX = 500;

/**
 * Spec wording is "unicode lowercase alphanumeric characters and hyphens", and the
 * reference validator uses Python's unicode-aware str.isalnum(). We deliberately
 * narrow to ASCII for predictable directory names across Windows/macOS/Linux.
 */
const NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Only these subdirectories are meaningful inside a skill (spec-defined). */
const ALLOWED_SKILL_SUBDIRS = new Set(['scripts', 'references', 'assets']);

/** Recommended ceiling from the spec; our house target is lower. */
const BODY_LINES_ERROR = 500;
const BODY_LINES_WARN = 280;

const MAX_FILE_BYTES = 1024 * 1024; // 1 MiB

// ---------------------------------------------------------------------------
// House rules
// ---------------------------------------------------------------------------

const REQUIRED_SECTIONS = [
  'Purpose',
  'Inputs',
  'Workflow',
  'Decision logic',
  'Outputs',
  'Failure handling',
  'Example',
  'Related skills',
];

/**
 * Constructs that work only in Claude Code and silently no-op elsewhere.
 * A skill advertised as cross-agent must not use any of them.
 */
const NON_PORTABLE = [
  { pattern: /\$\{CLAUDE_[A-Z_]+\}/, label: 'CLAUDE_* template variable' },
  { pattern: /^[ \t]*!`/m, label: 'dynamic shell injection' },
];

/** Claude Code frontmatter extensions. Valid there, rejected by the spec validator. */
const CLAUDE_ONLY_FIELDS = new Set([
  'context', 'model', 'effort', 'arguments', 'paths', 'user-invocable',
  'disable-model-invocation', 'shell', 'argument-hint', 'icon', 'color',
]);

/** Phrases an agent can claim to have followed without producing anything. */
const VAGUE_PHRASES = [
  'works correctly',
  'behaves as expected',
  'handles gracefully',
  'as appropriate',
  'good tests',
  'thorough coverage',
  'best practices',
];

// ---------------------------------------------------------------------------
// Strict frontmatter parser
// ---------------------------------------------------------------------------

const BLOCK_SCALAR = /^([>|])([-+]?)$/;

/**
 * Parse SKILL.md frontmatter. Intentionally rejects YAML features that have no
 * place in a skill header: flow sequences/maps, tabs, anchors, multi-level nesting.
 *
 * @returns {{data: Record<string, unknown>, errors: string[], bodyStart: number}}
 */
function parseFrontmatter(text) {
  const errors = [];
  const data = Object.create(null);
  const lines = text.split(/\r?\n/);

  if (lines[0] !== '---') {
    errors.push('frontmatter must open with `---` on line 1');
    return { data, errors, bodyStart: 0 };
  }

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---' || lines[i] === '...') {
      end = i;
      break;
    }
  }
  if (end === -1) {
    errors.push('frontmatter is never closed with `---`');
    return { data, errors, bodyStart: 0 };
  }

  let i = 1;
  while (i < end) {
    const raw = lines[i];
    const lineNo = i + 1;

    if (raw.trim() === '') {
      i++;
      continue;
    }
    if (raw.includes('\t')) {
      errors.push(`line ${lineNo}: tabs are not allowed in YAML frontmatter`);
      i++;
      continue;
    }
    if (/^\s/.test(raw)) {
      errors.push(`line ${lineNo}: unexpected indentation (orphaned value?)`);
      i++;
      continue;
    }

    const m = raw.match(/^([A-Za-z0-9_-]+):(.*)$/);
    if (!m) {
      errors.push(`line ${lineNo}: expected "key: value", got: ${raw.slice(0, 60)}`);
      i++;
      continue;
    }

    const key = m[1];
    const rest = m[2].trim();

    if (key in data) {
      errors.push(`line ${lineNo}: duplicate key \`${key}\``);
    }

    const block = rest.match(BLOCK_SCALAR);
    if (block) {
      // Folded (>) or literal (|) block scalar: consume the indented lines below.
      const chunk = [];
      i++;
      while (i < end) {
        const next = lines[i];
        if (next.trim() !== '' && !/^\s/.test(next)) break;
        chunk.push(next.replace(/^ {1,4}/, ''));
        i++;
      }
      while (chunk.length && chunk[chunk.length - 1].trim() === '') chunk.pop();
      data[key] = block[1] === '>'
        ? chunk.map((l) => l.trim()).join(' ').replace(/\s+/g, ' ').trim()
        : chunk.join('\n');
      continue;
    }

    if (rest === '') {
      // Nested map -- permitted for `metadata` only, one level deep.
      const map = Object.create(null);
      i++;
      while (i < end) {
        const next = lines[i];
        if (next.trim() === '') {
          i++;
          continue;
        }
        if (!/^\s/.test(next)) break;
        if (next.includes('\t')) {
          errors.push(`line ${i + 1}: tabs are not allowed`);
          i++;
          continue;
        }
        const nm = next.match(/^\s+([A-Za-z0-9_.-]+):(.*)$/);
        if (!nm) {
          errors.push(`line ${i + 1}: expected "key: value" inside \`${key}\``);
          i++;
          continue;
        }
        const nestedVal = nm[2].trim();
        if (nestedVal === '') {
          errors.push(`line ${i + 1}: \`${key}.${nm[1]}\` must be a string; nested maps are not allowed`);
        } else if (nestedVal.startsWith('[') || nestedVal.startsWith('{')) {
          errors.push(`line ${i + 1}: \`${key}.${nm[1]}\` must be a string, not a YAML collection`);
        } else {
          map[nm[1]] = unquote(nestedVal);
        }
        i++;
      }
      data[key] = map;
      continue;
    }

    // Flow collections parse as arrays/objects, not strings. This is the exact
    // shape of anthropics/skills#239: "description: [something]" becomes a list.
    if (rest.startsWith('[') || rest.startsWith('{')) {
      errors.push(
        `line ${lineNo}: \`${key}\` starts with "${rest[0]}" so YAML parses it as a `
        + 'collection, not a string. Quote the value.'
      );
      data[key] = { __notAString: true };
      i++;
      continue;
    }
    if (rest.startsWith('&') || rest.startsWith('*')) {
      errors.push(`line ${lineNo}: YAML anchors and aliases are not allowed`);
      i++;
      continue;
    }

    data[key] = unquote(rest);
    i++;
  }

  return { data, errors, bodyStart: end + 1 };
}

function unquote(v) {
  const isQuoted = v.length >= 2
    && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"));
  return isQuoted ? v.slice(1, -1) : v;
}

// ---------------------------------------------------------------------------
// Filesystem helpers
// ---------------------------------------------------------------------------

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}

const posix = (p) => p.split(sep).join('/');

// ---------------------------------------------------------------------------
// Per-skill validation
// ---------------------------------------------------------------------------

function validateSkill(skillDir, repoRoot) {
  const errors = [];
  const warnings = [];
  const skillPath = join(skillDir, 'SKILL.md');
  const dirName = skillDir.split(sep).pop();
  const rel = posix(relative(repoRoot, skillPath));

  const text = readFileSync(skillPath, 'utf8');
  const { data, errors: fmErrors, bodyStart } = parseFrontmatter(text);
  errors.push(...fmErrors);

  // --- frontmatter fields -------------------------------------------------
  for (const key of Object.keys(data)) {
    if (ALLOWED_FIELDS.has(key)) continue;
    if (CLAUDE_ONLY_FIELDS.has(key)) {
      errors.push(
        `frontmatter field \`${key}\` is a Claude Code extension: rejected by the spec `
        + `validator and ignored by other agents. Allowed: ${[...ALLOWED_FIELDS].join(', ')}`
      );
    } else {
      errors.push(`unexpected frontmatter field \`${key}\`. Allowed: ${[...ALLOWED_FIELDS].join(', ')}`);
    }
  }
  for (const req of REQUIRED_FIELDS) {
    if (!(req in data)) errors.push(`missing required frontmatter field \`${req}\``);
  }

  // --- name ---------------------------------------------------------------
  const name = data.name;
  if (name !== undefined) {
    if (typeof name !== 'string') {
      errors.push('`name` must be a string');
    } else {
      if (name.length < 1 || name.length > NAME_MAX) {
        errors.push(`\`name\` must be 1-${NAME_MAX} characters (got ${name.length})`);
      }
      if (!NAME_PATTERN.test(name)) {
        errors.push(
          '`name` must be lowercase ASCII alphanumerics separated by single hyphens, '
          + `with no leading, trailing or consecutive hyphens (got "${name}")`
        );
      }
      if (name !== dirName) {
        errors.push(`\`name\` ("${name}") must equal the parent directory name ("${dirName}")`);
      }
      if (/anthropic|claude/i.test(name)) {
        errors.push('`name` must not contain the reserved words "anthropic" or "claude"');
      }
    }
  }

  // --- description --------------------------------------------------------
  const description = data.description;
  if (description !== undefined) {
    if (typeof description !== 'string') {
      errors.push('`description` must be a string (see the flow-collection error above)');
    } else {
      if (description.length < 1 || description.length > DESCRIPTION_MAX) {
        errors.push(`\`description\` must be 1-${DESCRIPTION_MAX} characters (got ${description.length})`);
      }
      if (/[<>]/.test(description)) {
        errors.push('`description` must not contain angle brackets (rejected when packaging for the API)');
      }
      if (!/use when/i.test(description)) {
        errors.push('house rule: `description` must contain a trigger clause ("Use when ...")');
      }
      if (!/not for/i.test(description)) {
        errors.push('house rule: `description` must contain an anti-trigger clause ("Not for ...")');
      }
    }
  }

  // --- other spec fields --------------------------------------------------
  if ('compatibility' in data) {
    const c = data.compatibility;
    if (typeof c !== 'string') {
      errors.push('`compatibility` must be a string');
    } else if (c.length > COMPATIBILITY_MAX) {
      errors.push(`\`compatibility\` must be at most ${COMPATIBILITY_MAX} characters (got ${c.length})`);
    }
  }
  if ('metadata' in data) {
    const meta = data.metadata;
    if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
      errors.push('`metadata` must be a map of string keys to string values');
    } else {
      for (const [k, v] of Object.entries(meta)) {
        if (typeof v !== 'string') errors.push(`\`metadata.${k}\` must be a string`);
      }
    }
  }
  if ('allowed-tools' in data) {
    warnings.push('`allowed-tools` is experimental and support varies between agents; prefer omitting it');
  }

  // --- body ---------------------------------------------------------------
  const body = text.split(/\r?\n/).slice(bodyStart);
  const bodyText = body.join('\n');

  if (body.length > BODY_LINES_ERROR) {
    errors.push(
      `body is ${body.length} lines; the spec recommends under ${BODY_LINES_ERROR}. `
      + 'Move detail into references/'
    );
  } else if (body.length > BODY_LINES_WARN) {
    warnings.push(`body is ${body.length} lines; house target is ${BODY_LINES_WARN}. Consider references/`);
  }
  if (bodyText.trim() === '') errors.push('body is empty');

  const headings = [...bodyText.matchAll(/^##\s+(.+?)\s*$/gm)].map((m) => m[1].toLowerCase());
  for (const section of REQUIRED_SECTIONS) {
    if (!headings.includes(section.toLowerCase())) {
      errors.push(`missing required section "## ${section}"`);
    }
  }
  if (!/use when/i.test(bodyText)) {
    errors.push('body must state when to use the skill ("Use when")');
  }
  if (!/do not use when/i.test(bodyText)) {
    errors.push('body must state when NOT to use the skill ("Do not use when")');
  }

  // --- portability --------------------------------------------------------
  for (const { pattern, label } of NON_PORTABLE) {
    if (pattern.test(text)) {
      errors.push(`non-portable construct: ${label}. Use a script in scripts/ invoked by relative path`);
    }
  }

  // --- vague phrases (warning) --------------------------------------------
  for (const phrase of VAGUE_PHRASES) {
    if (new RegExp(`\\b${phrase}\\b`, 'i').test(bodyText)) {
      warnings.push(`vague phrase "${phrase}" -- state an observable outcome instead`);
    }
  }

  // --- relative links -----------------------------------------------------
  for (const match of bodyText.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].split('#')[0].trim();
    if (!target || /^(https?:|mailto:)/.test(target)) continue;
    if (target.startsWith('/')) {
      errors.push(`link "${target}" is root-absolute; use a path relative to SKILL.md`);
      continue;
    }
    if (target.startsWith('../')) {
      errors.push(
        `link "${target}" escapes the skill directory. Installed skills are standalone -- `
        + 'vendor shared content into references/ instead'
      );
      continue;
    }
    const depth = target.split('/').filter((s) => s && s !== '.').length - 1;
    if (depth > 1) errors.push(`link "${target}" is more than one level deep from SKILL.md`);
    if (!existsSync(join(skillDir, target))) {
      errors.push(`link "${target}" does not resolve to an existing file`);
    }
  }

  // --- subdirectories -----------------------------------------------------
  for (const e of readdirSync(skillDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (!ALLOWED_SKILL_SUBDIRS.has(e.name)) {
      errors.push(
        `unexpected subdirectory "${e.name}/". The spec defines only `
        + `${[...ALLOWED_SKILL_SUBDIRS].join('/, ')}/ (output templates go in assets/)`
      );
    }
  }

  // --- file sizes ---------------------------------------------------------
  for (const f of walk(skillDir)) {
    const bytes = statSync(f).size;
    if (bytes > MAX_FILE_BYTES) {
      errors.push(`${posix(relative(skillDir, f))} is ${(bytes / 1024).toFixed(0)} KiB, over the 1 MiB cap`);
    }
  }

  return {
    name: typeof name === 'string' ? name : dirName,
    dirName,
    rel,
    description,
    bodyText,
    errors,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const args = process.argv.slice(2);
  const jsonOut = args.includes('--json');
  const target = args.find((a) => !a.startsWith('--')) ?? 'skills';
  const repoRoot = process.cwd();
  const skillsRoot = join(repoRoot, target);

  if (!existsSync(skillsRoot)) {
    console.error(`No such directory: ${target}`);
    process.exit(2);
  }

  const results = [];
  const repoErrors = [];

  const allDirs = readdirSync(skillsRoot, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => join(skillsRoot, e.name));

  const skillDirs = allDirs.filter((d) => existsSync(join(d, 'SKILL.md')));

  // A directory under skills/ with no SKILL.md is half-written work, not a skill.
  // Without this check it ships silently and is invisible to `npx skills add --list`.
  for (const d of allDirs) {
    if (!existsSync(join(d, 'SKILL.md'))) {
      repoErrors.push(
        `${posix(relative(repoRoot, d))}/ has no SKILL.md. `
        + 'Every directory under skills/ must be a complete skill; remove it or finish it'
      );
    }
  }

  for (const d of skillDirs) results.push(validateSkill(d, repoRoot));

  // --- repo-level checks --------------------------------------------------

  // A stray SKILL.md outside skills/ would be discovered and installed as a real skill.
  // This is a whole-repository check, so it only applies when validating the canonical
  // skills tree -- not when the validator is pointed at a subtree such as a test fixture.
  // tests/fixtures/ is exempt: it is the validator's own corpus of broken skills, and
  // because skills/ always exists the CLI never falls back to a recursive scan.
  const targetPosix = posix(target).replace(/\/+$/, '');
  if (targetPosix === 'skills') {
    for (const f of walk(repoRoot)) {
      if (!f.endsWith(`${sep}SKILL.md`)) continue;
      const r = posix(relative(repoRoot, f));
      if (r.startsWith('tests/fixtures/')) continue;
      if (!r.startsWith(`${targetPosix}/`)) {
        repoErrors.push(`${r}: SKILL.md outside ${targetPosix}/ would be discovered and installed as a skill`);
      } else if (r.split('/').length !== 3) {
        repoErrors.push(`${r}: expected ${targetPosix}/<skill-name>/SKILL.md`);
      }
    }
  }

  const byName = new Map();
  const byDescription = new Map();
  for (const r of results) {
    if (byName.has(r.name)) repoErrors.push(`duplicate skill name "${r.name}"`);
    byName.set(r.name, r);
    if (typeof r.description === 'string') {
      const key = r.description.toLowerCase().replace(/\s+/g, ' ').trim();
      if (byDescription.has(key)) {
        repoErrors.push(`skills "${byDescription.get(key)}" and "${r.name}" have identical descriptions`);
      }
      byDescription.set(key, r.name);
    }
  }

  // A skill carrying "not yet in this repo" for a skill that now EXISTS is stale, and it
  // actively misroutes: the agent refuses to hand off to something that is installed.
  // This goes stale exactly when a planned skill lands, which is when nobody rereads the
  // neighbours, so it has to be machine-checked.
  // Scan whole lines rather than a fixed window: these caveats sit in table cells,
  // separated from the skill name by em dashes and other prose, and the wording varies
  // ("not yet in this repo", "neither is yet in this repo").
  for (const r of results) {
    for (const line of r.bodyText.split('\n')) {
      const caveat = line.search(/yet in this repo/i);
      if (caveat === -1) continue;
      // The caveat qualifies the nearest skill name to its left. A single line may
      // legitimately name an unbuilt skill (caveated) alongside built ones.
      const before = [...line.slice(0, caveat).matchAll(/`([a-z0-9-]+)`/g)];
      const owner = before.length ? before[before.length - 1][1] : null;
      if (owner && byName.has(owner) && owner !== r.name) {
        repoErrors.push(
          `${r.rel}: \`${owner}\` carries a "not yet in this repo" caveat, but that skill `
          + 'exists. Remove it -- it stops the agent handing off to an installed skill'
        );
      }
    }
  }

  // Cross-references under "Related skills" must resolve to real skills.
  for (const r of results) {
    const section = r.bodyText.split(/^##\s+Related skills\s*$/im)[1];
    if (!section) continue;
    for (const match of section.matchAll(/`([a-z0-9]+(?:-[a-z0-9]+)+)`/g)) {
      const ref = match[1];
      if (ref === r.name || byName.has(ref)) continue;
      r.warnings.push(`"Related skills" references \`${ref}\`, which is not a skill in this repo`);
    }
  }

  // Every skill should have a worked example committed.
  const examplesRoot = join(repoRoot, 'examples');
  if (existsSync(examplesRoot)) {
    const exampleText = walk(examplesRoot)
      .filter((f) => f.endsWith('.md'))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n');
    for (const r of results) {
      if (!exampleText.includes(r.name)) {
        r.warnings.push('no example under examples/ mentions this skill');
      }
    }
  }

  // --- report -------------------------------------------------------------

  const errorCount = results.reduce((n, r) => n + r.errors.length, 0) + repoErrors.length;
  const warnCount = results.reduce((n, r) => n + r.warnings.length, 0);

  if (jsonOut) {
    console.log(JSON.stringify({
      skills: results.map(({ name, rel, errors, warnings }) => ({ name, path: rel, errors, warnings })),
      repoErrors,
      errorCount,
      warnCount,
    }, null, 2));
    process.exit(errorCount > 0 ? 1 : 0);
  }

  for (const r of results) {
    if (r.errors.length === 0 && r.warnings.length === 0) {
      console.log(`  ok   ${r.name}`);
      continue;
    }
    console.log(`\n  ${r.errors.length ? 'FAIL' : 'warn'} ${r.name}  (${r.rel})`);
    for (const e of r.errors) console.log(`       error: ${e}`);
    for (const w of r.warnings) console.log(`       warn:  ${w}`);
  }

  if (repoErrors.length) {
    console.log('\n  FAIL repository');
    for (const e of repoErrors) console.log(`       error: ${e}`);
  }

  console.log(`\n${results.length} skill(s) checked -- ${errorCount} error(s), ${warnCount} warning(s)`);
  process.exit(errorCount > 0 ? 1 : 0);
}

main();
