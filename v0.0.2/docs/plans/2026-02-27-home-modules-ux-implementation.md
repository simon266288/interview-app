# Home + Module UX Optimization (v0.0.2) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve Home/Module interaction clarity and touch experience without introducing v0.0.3.

**Architecture:** Keep current routes and store contracts, optimize view composition and visual hierarchy in `HomeView.vue` and `ModuleListView.vue`. Add lightweight computed helpers in views only, avoid deep store refactor.

**Tech Stack:** Vue 3 + Pinia + Vue Router + Tailwind CSS + Vitest/Playwright

---

## Task 1: Home information hierarchy refresh
- Move primary actions (专项练习/模拟考试) to highest visual priority
- Group secondary actions (错题本/收藏夹/记忆卡片)
- Add conditional "continue learning" entry based on `practiceIndexByModule`

## Task 2: Module cards with progress state
- Add per-module progress summary: 完成/总数/剩余
- Add status chip: 未开始 / 进行中 / 已完成
- Update CTA text: 开始练习 / 继续练习 / 已完成（仍可进入复习）
- Keep empty modules visually de-emphasized and non-navigable

## Task 3: Interaction polishing
- Consistent active feedback (tap scale)
- Better spacing/typography for mobile readability
- Cleanup garbled texts in module page labels

## Task 4: Validation
- Run unit/component tests
- Run e2e smoke
- Manual visual verification on home/modules flows

## Task 5: Commit
- Single focused commit for UX changes
