# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Before 1.0.0, skill names may change. After 1.0.0, renaming a skill is a
breaking change.

## [Unreleased]

### Added

- Repository foundation: Apache-2.0 licence, contribution and security policy.
- `scripts/validate-skills.mjs`, a zero-dependency validator for the
  [Agent Skills specification](https://agentskills.io/specification) plus this
  repo's stricter house rules.
- `tests/run.mjs` and a corpus of deliberately-broken fixtures covering the
  validator's rules.
- `scripts/sync-shared.mjs`, which vendors shared references into the skills that
  use them and verifies the copies in CI.
- Continuous integration: validator tests, skill validation, Markdown linting,
  offline relative-link checking, and an oversized-file gate.
