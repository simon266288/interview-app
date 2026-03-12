# GitHub 300 Questions Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add ~300 new interview questions sourced from the 3 user-provided public GitHub repos into `src/data/questionBank.local.json`, keeping question format compatible and ensuring IDs/modules are valid.

**Architecture:** Create a small extraction + transformation pipeline that reads repo markdown content (via GitHub raw/API), produces a curated candidate pool, then converts candidates into `Question` objects (choice/judge/card) in the same style as existing questions. Persist to `questionBank.local.json` with a dedicated ID range (100001..100300) and validate via unit tests.

**Tech Stack:** Node (scripts), TypeScript, Vitest, existing Vue app data format.

---

### Task 1: Add validation utilities for local question bank

**Files:**
- Create: `scripts/question-bank/validate-local-bank.mjs`
- Test: `tests/unit/localQuestionBank.validation.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'

// We will add a validator script that can be imported from tests.
import { validateLocalQuestionBank } from '../../scripts/question-bank/validate-local-bank'

describe('local question bank validation', () => {
  it('rejects invalid modules and duplicate ids', () => {
    const res = validateLocalQuestionBank([
      {
        id: 100001,
        type: 'choice',
        module: 'NOT_A_MODULE',
        question: 'q',
        options: ['a', 'b', 'c', 'd'],
        answer: 0,
        analysis: 'x',
      },
      {
        id: 100001,
        type: 'judge',
        module: 'JS/CSS 基础',
        question: 'q2',
        answer: true,
        analysis: 'y',
      },
    ])

    expect(res.ok).toBe(false)
    expect(res.errors.join('\n')).toMatch(/module/i)
    expect(res.errors.join('\n')).toMatch(/duplicate/i)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL because `validateLocalQuestionBank` does not exist.

**Step 3: Write minimal implementation**

Create `scripts/question-bank/validate-local-bank.mjs` exporting a pure function `validateLocalQuestionBank(questions)` that:
- Checks `id` is integer
- Checks `id` uniqueness
- Checks `type` is one of `choice|judge|card`
- Checks `module` is included in `MODULES` (import from `src/data/questionBank.ts` via existing export script technique, or hard-import if Node ESM can load TS in this repo)
- Checks choice has `options.length >= 2` and `answer` is a valid index
- Checks judge has boolean `answer`
- Checks card has string `answer`
Return `{ ok: boolean, errors: string[] }`.

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

**Step 5: Commit**

_N/A (repo is not a git repository)_

---

### Task 2: Add a GitHub content fetcher (read-only)

**Files:**
- Create: `scripts/question-bank/github-fetch.mjs`
- Test: `tests/unit/githubFetch.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { listRepoMarkdownFiles } from '../../scripts/question-bank/github-fetch'

describe('github fetch', () => {
  it('lists markdown files from a public repo', async () => {
    const files = await listRepoMarkdownFiles({ owner: 'haizlin', repo: 'fe-interview' })
    expect(files.length).toBeGreaterThan(0)
    expect(files.some(f => f.path.endsWith('.md'))).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL because fetcher does not exist.

**Step 3: Implement minimal fetcher**

Implement `listRepoMarkdownFiles` using GitHub API:
- Use unauthenticated requests by default (allow token via env `GITHUB_TOKEN`)
- Use `https://api.github.com/repos/{owner}/{repo}/git/trees/{sha}?recursive=1` to list tree
- Filter for `.md` files

Also implement `fetchRawFile({ owner, repo, path, ref })` via raw GitHub URL.

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

**Step 5: Commit**

_N/A_

---

### Task 3: Build a “candidate pool” extractor

**Files:**
- Create: `scripts/question-bank/extract-candidates.mjs`
- Test: `tests/unit/candidateExtraction.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import { extractCandidatesFromMarkdown } from '../../scripts/question-bank/extract-candidates'

describe('candidate extraction', () => {
  it('extracts Q/A style candidates from markdown', () => {
    const md = `# Title\n\n## Q1\nA1 line\n\n## Q2\n- a\n- b\n`
    const candidates = extractCandidatesFromMarkdown(md)
    expect(candidates.length).toBeGreaterThan(0)
    expect(candidates[0]).toHaveProperty('text')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL.

**Step 3: Implement minimal extractor**

Implement `extractCandidatesFromMarkdown(md)` that:
- Splits by headings
- Extracts paragraphs / list blocks
- Produces `Candidate` objects: `{ title?: string, text: string }`

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

**Step 5: Commit**

_N/A_

---

### Task 4: Map candidates to modules and question types

**Files:**
- Create: `scripts/question-bank/map-to-questions.mjs`
- Test: `tests/unit/mapCandidatesToQuestions.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import { mapCandidatesToQuestions } from '../../scripts/question-bank/map-to-questions'

describe('mapping', () => {
  it('maps a candidate into a valid Question object', () => {
    const qs = mapCandidatesToQuestions({
      candidates: [{ text: '解释闭包，并给一个常见应用场景。' }],
      startId: 100001,
      count: 1,
    })

    expect(qs).toHaveLength(1)
    expect(qs[0].id).toBe(100001)
    expect(['choice', 'judge', 'card']).toContain(qs[0].type)
    expect(typeof qs[0].module).toBe('string')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL.

**Step 3: Implement minimal mapping rules**

Implement:
- Keyword-based module mapping (JS/Vue/Network/Perf/Engineering/TS/React/LowCode/Handwrite/Scenario)
- Default question types according to desired ratio (computed later)
- Create `analysis` without repo references

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

**Step 5: Commit**

_N/A_

---

### Task 5: Generate exactly 300 questions into questionBank.local.json

**Files:**
- Modify: `src/data/questionBank.local.json`
- Create: `scripts/question-bank/generate-local-bank.mjs`
- Test: `tests/unit/localQuestionBank.generation.test.ts`

**Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest'
import localQuestions from '../../src/data/questionBank.local.json'

describe('local question bank', () => {
  it('contains exactly 300 questions with id range 100001..100300', () => {
    expect(localQuestions).toHaveLength(300)
    const ids = new Set(localQuestions.map(q => q.id))
    expect(ids.size).toBe(300)
    expect(Math.min(...localQuestions.map(q => q.id))).toBe(100001)
    expect(Math.max(...localQuestions.map(q => q.id))).toBe(100300)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm run test`
Expected: FAIL because JSON is empty.

**Step 3: Implement generator + write JSON**

Implement `scripts/question-bank/generate-local-bank.mjs` that:
- Fetches repo markdown
- Extracts candidates
- De-dupes candidates
- Computes current bank type ratio by reading `src/data/questionBank.ts` (or by importing `QUESTION_BANK` via existing export script pattern)
- Produces 300 `Question` entries with ids 100001..100300
- Writes them to `src/data/questionBank.local.json`

**Step 4: Run test to verify it passes**

Run: `npm run test`
Expected: PASS.

**Step 5: Manual sanity check**
- Run app: `npm run dev`
- Click “换一批” then enter practice; verify questions change.

---

### Task 6: E2E sanity

**Files:**
- (No code changes expected)

**Step 1: Run e2e**

Run: `npm run e2e`
Expected: PASS.

---

## Execution choice

Plan complete and saved to `docs/plans/2026-03-12-github-300q-implementation-plan.md`.

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration
2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints
