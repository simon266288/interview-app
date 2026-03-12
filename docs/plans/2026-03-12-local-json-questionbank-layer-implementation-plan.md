# Local JSON QuestionBank Layer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single “effective question bank” layer so the app defaults to showing a per-module random sampled batch ("换一批" via seed), without introducing "base vs generated" terminology, and ensure favorites/wrongs persist via snapshot storage even when the active batch changes.

**Architecture:** Keep the existing static TS question list as part of "the question bank" and optionally merge additional questions from a local JSON file; expose one API for views to query effective questions/modules. Persist user selection (seed + per-module sample size + mode) and migrate progress storage to snapshot items.

**Tech Stack:** Vue 3 + TypeScript + Vite, Pinia, Vitest (happy-dom), Playwright.

---

## Key decisions (already agreed)
- Default mode: **sample-by-module** (1A) and **enabled by default**.
- Wrong/favorite: **snapshot (2C)** so lists can render even if the current batch doesn't include a question.
- No remote bank, no git/GitHub fetch.
- Do not present UI as "bank A vs bank B"; only "题库显示" and "换一批".

## Task 1: Add local JSON questions file (optional source)

**Files:**
- Create: `src/data/questionBank.local.json`
- Modify: `src/domain/question.types.ts` (only if needed)
- Test: `tests/unit/questionBank.test.ts`

**Step 1: Write failing test**
Update `tests/unit/questionBank.test.ts` to expect the app can import local JSON question array (may be empty initially) and that effective bank id uniqueness holds after merge.

**Step 2: Run test to verify it fails**
Run: `npm run test`
Expected: FAIL due to missing JSON import.

**Step 3: Minimal implementation**
Create `src/data/questionBank.local.json` containing `[]`.

**Step 4: Run tests**
Run: `npm run test`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/data/questionBank.local.json tests/unit/questionBank.test.ts
git commit -m "feat: add local JSON question source"
```

## Task 2: Implement effective question bank module (merge + sample-by-module)

**Files:**
- Create: `src/services/effectiveQuestionBank.ts`
- Modify: `src/data/questionBank.ts` (export a helper if useful, otherwise keep)
- Test: `tests/unit/effectiveQuestionBank.test.ts`

**Step 1: Write failing tests**
Create `tests/unit/effectiveQuestionBank.test.ts` to cover:
- merges TS questions + JSON questions
- sampling is per-module, deterministic by seed
- changing seed changes sample
- sample includes only modules in `MODULES`
- de-duplicates by id (choose first occurrence)

**Step 2: Run tests to verify failure**
Run: `npm run test`
Expected: FAIL because module missing.

**Step 3: Implement minimal effective bank**
Implement exports:
- `getAllQuestions(): Question[]`
- `getEffectiveQuestions(opts): Question[]`
- `getEffectiveModules(opts): string[]`

Implement deterministic shuffle (seeded PRNG) and per-module sampling.

**Step 4: Run tests**
Run: `npm run test`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/services/effectiveQuestionBank.ts tests/unit/effectiveQuestionBank.test.ts
git commit -m "feat: add effective question bank sampling"
```

## Task 3: Add a Pinia store for question bank display settings (seed + per-module N)

**Files:**
- Create: `src/stores/questionBankSettings.store.ts`
- Modify: `src/services/storage.ts`
- Test: `tests/unit/questionBankSettings.store.test.ts`

**Step 1: Write failing tests**
- default mode is sampling enabled
- seed exists and persists
- `shuffleSeed()` changes seed
- per-module sample size default value (define as e.g. 20) persists

**Step 2: Run tests**
Run: `npm run test`
Expected: FAIL.

**Step 3: Implement store + persist**
Extend `ProgressState` (or create separate key) to store settings:
- `questionBankSeed: number`
- `samplePerModule: number`

Prefer to keep existing STORAGE_KEY but bump `schemaVersion`.

**Step 4: Run tests**
Run: `npm run test`
Expected: PASS.

**Step 5: Commit**
```bash
git add src/stores/questionBankSettings.store.ts src/services/storage.ts tests/unit/questionBankSettings.store.test.ts
git commit -m "feat: persist question bank sampling settings"
```

## Task 4: Migrate progress store to snapshot-based wrong/favorite

**Files:**
- Modify: `src/services/storage.ts`
- Modify: `src/stores/progress.store.ts`
- Modify: `src/views/QuestionListView.vue`
- Test: `tests/unit/progress.store.test.ts`
- Test: `tests/component/questionList.view.test.ts`

**Step 1: Write failing tests**
Update unit/component tests to assert:
- toggling favorite creates/updates snapshot item
- wrong snapshot created on `addWrong`
- QuestionListView renders items even if effective bank doesn't include the id

**Step 2: Run tests (expect fail)**
Run: `npm run test`

**Step 3: Implement storage shape + migration**
- Update `ProgressState` with:
  - `wrongItemsById?: Record<number, Question>`
  - `favoriteItemsById?: Record<number, Question>`
  - keep `wrongIds`/`favoriteIds` for backwards compatibility, but derive them from the snapshot maps going forward.
- In `init()`, if schemaVersion old, attempt to map old ids to questions via `getAllQuestions()` from effective bank service; if found, snapshot; if not, keep id without snapshot (render minimal placeholder or omit; decide in tests).

**Step 4: Update progress store actions**
- `toggleFavorite(id, snapshot?: Question)` or `toggleFavorite(q: Question)` (pick one and update callers)
- `addWrong(q: Question)` / `addCompleted(q: Question)` to capture snapshot.

**Step 5: Update views to pass Question snapshots**
- In `QuizView.vue`, when selecting option and marking wrong/completed/favorite, pass the current question snapshot.
- In `QuestionListView.vue`, render from store snapshot maps.

**Step 6: Run tests**
Run: `npm run test`
Expected: PASS.

**Step 7: Commit**
```bash
git add src/services/storage.ts src/stores/progress.store.ts src/views/QuestionListView.vue src/views/QuizView.vue tests/unit/progress.store.test.ts tests/component/questionList.view.test.ts
git commit -m "feat: snapshot wrong/favorite for batch switching"
```

## Task 5: Switch views to use effective questions instead of direct QUESTION_BANK

**Files:**
- Modify: `src/views/QuizView.vue`
- Modify: `src/views/ModuleListView.vue`
- Modify: `tests/component/quiz.view.test.ts`

**Step 1: Write failing test**
Update `quiz.view.test.ts` to set seed and ensure it still renders correct titles; add a test verifying practice mode uses effective questions (non-empty) even if sample is enabled.

**Step 2: Implement view changes**
- Replace imports of `QUESTION_BANK` with `getEffectiveQuestions()` call (wired to settings store)
- Ensure exam mode draws from effective pool (excluding cards) but still uses sampling settings.

**Step 3: Run tests**
Run: `npm run test`
Expected: PASS.

**Step 4: Commit**
```bash
git add src/views/QuizView.vue src/views/ModuleListView.vue tests/component/quiz.view.test.ts
git commit -m "feat: use effective question bank in views"
```

## Task 6: Add minimal UI to "换一批" (seed refresh)

**Files:**
- Modify: `src/views/HomeView.vue` (or the most appropriate existing entry)
- Modify: `src/router/index.ts` (only if adding a settings view)
- Test: `tests/component/home.view.test.ts`

**Step 1: Write failing test**
Assert a button exists (e.g. data-testid `bank.shuffle`) and clicking it updates persisted seed.

**Step 2: Implement minimal UI**
Add a "换一批" button that calls settings store `shuffleSeed()`.

**Step 3: Run tests**
Run: `npm run test`

**Step 4: Commit**
```bash
git add src/views/HomeView.vue tests/component/home.view.test.ts
git commit -m "feat: add shuffle batch button"
```

## Task 7: Sanity check with Playwright (optional)

**Files:**
- Modify: `tests/e2e/*.spec.ts` (only if needed)

**Steps:**
- Run: `npm run e2e`
- Verify: switching batch doesn't lose favorites/errors list rendering.

---

## Rollout notes
- If storage migration causes unexpected behavior, add a temporary one-time migration guard keyed by schemaVersion.

---

Plan complete and saved to `docs/plans/2026-03-12-local-json-questionbank-layer-implementation-plan.md`. Two execution options:

1. Subagent-Driven (this session) — I dispatch fresh subagent per task, review between tasks, fast iteration

2. Parallel Session (separate) — Open new session with executing-plans, batch execution with checkpoints

Which approach?
