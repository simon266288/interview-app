# Testing (Playwright E2E + Vitest Component Tests) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add reliable browser E2E smoke tests (run outside Trae sandbox) and stable component tests to validate core app flows.

**Architecture:** Keep E2E minimal (one smoke spec covering critical user journeys) and push most coverage into Vitest component/unit tests. E2E runs against a locally started Vite dev server; component tests run in a DOM-like environment without launching a real browser.

**Tech Stack:** Vite + Vue 3 + Pinia + Vue Router + Tailwind, Vitest, @vue/test-utils, happy-dom, Playwright (@playwright/test).

---

## Preconditions

- Use Node.js 18+.
- Run Playwright E2E from your normal terminal (Windows Terminal/PowerShell) or CI, not from Trae sandbox.
- Dev server should be reachable at `http://localhost:5173/`.

---

## Task 1: Add Playwright E2E scaffolding and npm scripts

**Files:**
- Modify: `package.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- (Optional) Create: `tests/e2e/README.md`

**Step 1: Install dependencies**

Run:
```bash
npm i -D @playwright/test playwright
```

**Step 2: Install browsers (one-time on each machine/CI runner)**

Run:
```bash
npx playwright install
```

Expected: downloads browsers and completes without error.

**Step 3: Add scripts**

Update `package.json` scripts:
- `e2e`: `playwright test`
- `e2e:ui` (optional): `playwright test --ui`
- `e2e:report` (optional): `playwright show-report`

**Step 4: Create Playwright config**

Create `playwright.config.ts` with:
- `testDir: 'tests/e2e'`
- `use.baseURL = 'http://localhost:5173'`
- `use.trace = 'retain-on-failure'`
- `use.screenshot = 'only-on-failure'`
- `use.video = 'retain-on-failure'`
- `retries = 1` (CI) / `0` (local) can be a single value for simplicity
- `webServer`: run `npm run dev -- --host 127.0.0.1 --port 5173` (so E2E can start server automatically)

**Step 5: Write E2E smoke spec**

Create `tests/e2e/smoke.spec.ts`:
- Test “Home renders” (expects key texts/buttons)
- Flow: Home → 专项练习 → 选择模块（JS/CSS 基础）→ 进入 Quiz → 点击一个选项 → 点击收藏星标 → 返回首页
- Flow: Home → 模拟考试 → 进入 Quiz(exam) → 点击一个选项 → 下一题 → 交卷 → 结果页出现 “考试结束” 和 “返回首页”
- Flow: Home → 错题本 / 收藏夹 → 页面标题渲染 → 返回首页
- Flow: Home → 记忆卡片模式 → 选择模块（手写代码）→ 翻卡 → 出现 “参考答案：”

Selectors recommendation:
- Prefer role/text selectors: `getByRole('button', { name: '专项练习' })`, `getByText('前端面试助手')`.
- Avoid brittle CSS selectors.

**Step 6: Run E2E**

Run:
```bash
npm run e2e
```

Expected:
- Dev server starts automatically (or reuses if already running).
- Smoke spec passes.
- On failure, `playwright-report/` and trace/screenshot artifacts exist.

---

## Task 2: Add Vitest component testing stack (happy-dom) + first component tests

**Files:**
- Modify: `vitest.config.ts`
- Create: `tests/component/home.view.test.ts`
- Create: `tests/component/quiz.view.test.ts`
- Create: `tests/component/questionList.view.test.ts`

**Step 1: Install dependencies**

Run:
```bash
npm i -D @vue/test-utils happy-dom
```

**Step 2: Configure Vitest for component tests**

Update `vitest.config.ts` to support two categories:
- Unit tests in Node env: `tests/unit/**/*.test.ts`
- Component tests in happy-dom env: `tests/component/**/*.test.ts`

Implementation approach:
- Keep a single config but use `test.environmentMatchGlobs`:
  - `['tests/component/**/*.test.ts', 'happy-dom']`
  - default environment stays `node` for unit tests

**Step 3: Add component test: HomeView**

Create `tests/component/home.view.test.ts`:
- Mount `HomeView` with a test router and pinia.
- Assert buttons exist: 专项练习 / 模拟考试 / 错题本 / 收藏夹 / 记忆卡片模式.
- Click 模拟考试 and assert router navigates to `/quiz?mode=exam`.

**Step 4: Add component test: QuizView**

Create `tests/component/quiz.view.test.ts`:
- Mount `QuizView` with router route set to:
  - `/quiz?mode=exam` and assert title “模拟考试中...”
  - `/quiz?module=JS/CSS%20基础` and assert title contains module name
  - `/quiz?mode=card&module=手写代码` and assert card UI exists (`.flip-card`)

**Step 5: Add component test: QuestionListView**

Create `tests/component/questionList.view.test.ts`:
- Provide pinia store state with wrongIds/favoriteIds.
- Navigate to `/errors` and assert title “错题本”.
- Click first list item and assert navigation to `/quiz?mode=list`.

**Step 6: Run unit + component tests**

Run:
```bash
npm test
```

Expected: all tests pass.

---

## Task 3 (Optional): Add CI workflow for test gate

**Files:**
- Create: `.github/workflows/ci.yml`

**Steps:**
- Install deps
- Run `npm test`
- Run `npx playwright install --with-deps` (Windows runner typically doesn’t need `--with-deps`, Linux does)
- Run `npm run e2e`
- Upload `playwright-report` and `test-results` as artifacts on failure

---

## Notes / Troubleshooting

- If E2E fails because of timing, prefer `await expect(locator).toBeVisible()` over `waitForTimeout`.
- Prefer stable text/role selectors; consider adding `data-testid` only if absolutely necessary.
- If running in China network, configure mirror for browser downloads via environment:
  - `PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright`

