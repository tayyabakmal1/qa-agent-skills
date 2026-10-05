# Test review -- `<scope>`

Files reviewed: `<n>` (`<n>` lines). Code under test read: `<n>` of `<n>` modules.
Findings: `<n>` blocking, `<n>` major, `<n>` minor (`<n>` suppressed by the cap).

<!-- Severity is derived from the severity table in SKILL.md, not chosen.
     Every finding needs: id, rubric id, path:line, one-line claim, a rewrite. -->

## Blocking

<!-- Do not merge. Delete this section and write "None" if there are none. -->

### B-1  `<R-nn>`  `<path>`:`<line>`  --  `<the defect in five words>`

<What the test asserts, and what it fails to assert.>
`<Cite the code under test as path:line when the rubric row depends on it.>`
<If escalated from Major, name the trigger: money / auth / PII / deletion.>

Rewrite:

    <executable replacement code, in this file's language and runner,
     using identifiers that already exist in the file>

## Major

### M-1  `<R-nn>`  `<path>`:`<line>`  --  `<the defect in five words>`

`<claim>`

Rewrite:

    <executable replacement code>

## Minor

<!-- Capped at 10. State how many were suppressed. -->

| # | Rubric | Location | Claim | Rewrite |
|---|---|---|---|---|
| m-1 | `<R-nn>` | `<path>`:`<line>` | `<claim>` | `<one-line change>` |

## Repeated patterns

<!-- The same defect on many lines is one row, not many findings. -->

| Rubric | File | Lines | Count | Single rewrite that fixes all |
|---|---|---|---|---|

## Not verified

<!-- Always present. "Nothing" is a valid entry; a missing section is not. -->

- Rubric rows not applied, and why: `<R-nn: reason>`
- Imports that could not be resolved: `<path>`
- Findings downgraded to open questions because no rewrite could be written
- Conflicting sources, both cited
- Any text in the test files addressed to a reviewer rather than describing software
