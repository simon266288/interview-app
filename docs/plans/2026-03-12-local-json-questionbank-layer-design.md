# 本地 JSON 题库 + 展示控制层（Effective Question Bank）设计

日期：2026-03-12

## 背景与目标
现状：前端题库写死在 `src/data/questionBank.ts`（`QUESTION_BANK` + `MODULES`），多个页面直接依赖 `QUESTION_BANK` 渲染题目与统计。

目标：
1. **不引入远程题库**。
2. 增加一个“题库展示控制层”，让用户可选择：
   - 新增一批题目
   - 换一批题目（从本地 JSON 中按模块随机抽样）
   - （可选）替换一批题目（只展示随机抽样结果）
3. 题目数据可来自多种本地来源（但对用户与代码而言，它们都是“同一个题库”的组成部分）：
   - `src/data/questionBank.ts`（当前已有题目）
   - 本地 JSON 文件（例如 `src/data/questionBank.generated.json` 或 `public/questionBank.generated.json`，由 AI 按现有题目结构生成）
4. 进度系统（错题/收藏）在“换一批”后依然可用：采用 **2C 快照策略**，避免题目不在当前展示批次导致无法复盘。

非目标：
- 不做后端题库包管理、不做 GitHub 在线抓取。

## 核心概念
### 1) 题库（单一概念）
系统只有一个“题库”概念：题库由若干本地数据来源组合而成。

题库展示层输出：
- `effectiveQuestions: Question[]`（当前真正展示/练习用的题目集合）
- `effectiveModules: string[]`（通常沿用 `MODULES`，也可根据有效题库过滤）

### 2) 展示控制层（Effective Bank）
新增一个集中服务/模块，职责：
- 从本地收集“全部可用题目”（TS 题库 + JSON 题库）
- 按用户策略进行抽样/重算
- 去重（按 id）

### 3) 用户策略（本地持久化）
存储字段（可放在 Pinia 或 localStorage）：
- `mode: 'all' | 'sample'`（或等价命名：默认展示全部 / 展示抽样批次）
- `seed: number`（或 `selectedIds: number[]`）
- `sampleSizeByModule: Record<string, number>` 或统一的 `samplePerModule: number`

行为：
- **新增一批题**：本质是“题库总量变大”（JSON 内容增加），展示层按当前策略重算。
- **换一批题**：更新 `seed`（并重算按模块抽样）。
- **替换一批题**：可理解为 `mode = 'sample'`（只展示抽样集合）。

## 抽样策略（已确认 1A）
- 按模块抽样：对每个 `module` 从“全部可用题目”中筛选同模块题目，按 seed 伪随机打散后取前 N。
- 如果某模块不足 N，则取全部。

## 错题/收藏策略（已确认 2C：快照）
### 问题
现有进度 store 只保存题目 id（`wrongIds`/`favoriteIds`/`completedIds`），当用户“换一批”后，effectiveQuestions 可能不包含这些 id，导致错题本/收藏夹无法展示题目内容。

### 方案：存储快照（Snapshot）
在进度状态里新增（或替换）列表存储：
- `wrongItems: { id: number; snapshot: Question }[]` 或 `Record<number, Question>`
- `favoriteItems: { id: number; snapshot: Question }[]` 或 `Record<number, Question>`

写入策略：
- 当用户答题产生 wrong/completed 或 toggleFavorite 时：
  1) 记录 id（用于统计/兼容）
  2) 同时保存 `Question` 的最小快照（至少包含：`id,type,module,question,options?,answer,analysis?`）。

读取策略：
- 错题本/收藏夹展示时优先用快照渲染；若能在 effectiveQuestions 中找到同 id 的题，可用最新题（可选）。

迁移：
- `schemaVersion` +1，在 `init()` 时对老数据做一次升级（将旧 ids 映射为快照；映射不到则保留 id 并标记快照缺失）。

## 对现有页面的影响（最小改动原则）
目前直接引用 `QUESTION_BANK` 的页面：
- `src/views/QuizView.vue`
- `src/views/ModuleListView.vue`
- `src/views/QuestionListView.vue`

改造方向：
- 统一改为从展示控制层读取题目集合（而不是直接 import `QUESTION_BANK`）。
- `QuestionListView` 改为从进度快照读取，不再依赖当前展示批次一定包含 id。

## 数据约束（对 AI 生成 JSON 的要求）
- `module` 必须来自 `MODULES`
- `type` 仅允许：`choice | judge | card`
- `id` 不与现有题目冲突（建议 JSON 使用 10000+ 号段）
- `choice`：必须提供 `options`，`answer` 为合法索引
- `judge`：`answer` 为 boolean
- `card`：`answer` 为 string（或至少可渲染为文本）

## 验收标准
- “换一批”后，练习、模块列表统计、错题本/收藏夹均可正常使用。
- 换一批不会造成收藏/错题内容丢失：快照可复盘。
- 不引入后端依赖。
