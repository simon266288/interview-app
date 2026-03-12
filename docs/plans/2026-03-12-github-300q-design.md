# GitHub 300 题扩充设计（本地题库落地）

**Goal:** 基于用户提供的 3 个公开 GitHub 仓库内容，为当前前端面试刷题应用新增约 **300** 道题目，并落地到本地 `questionBank.local.json`，不引入“远程题库”概念。

**Architecture:** 采用“抽取 → 结构化 → 题型化”的流程，把 GitHub 内容整理成符合现有 `Question` 类型的数据；题库层仍通过 `getAllQuestions()` 合并 `QUESTION_BANK` 与 `questionBank.local.json`，并按 `id` 去重。

**Tech Stack:** Vue 3 + TypeScript + Pinia + Vite；题库数据为本地 JSON；生效层为 `src/services/effectiveQuestionBank.ts`。

---

## 1. 背景与约束

### 1.1 题目类型与数据结构
题目类型定义于：`src/domain/question.types.ts`

- `type`: `'choice' | 'judge' | 'card'`
- `Question` 核心字段：
  - `id: number`
  - `type: QuestionType`
  - `module: string`
  - `question: string`
  - `options?: string[]`（仅 choice）
  - `answer: number | boolean | string`
  - `analysis?: string`

### 1.2 模块约束（必须命中 MODULES）
生效层会对 module 做过滤：`effectiveQuestionBank.ts:isValidModule` 依赖 `MODULES.includes(mod)`。

因此新增题必须使用 `src/data/questionBank.ts` 的 `MODULES` 中已有模块名，例如：
- JS/CSS 基础
- Vue 核心原理
- 性能优化
- 工程化 (Webpack/Vite)
- 低代码平台
- 浏览器与网络
- 手写代码
- 场景题 & 项目经验
- React 基础（新模块）
- TypeScript 基础（新模块）

### 1.3 合并与去重规则（按 id 去重，保留第一次）
合并逻辑位于：`src/services/effectiveQuestionBank.ts:getAllQuestions()`

- 合并顺序：`[...QUESTION_BANK, ...localQuestions]`
- 去重规则：同 `id` 只保留第一次出现

这意味着：
- **本次新增题必须避免与现有 `QUESTION_BANK` 的 id 冲突**
- **新增题内部也必须保证 id 唯一**

### 1.4 不保留来源引用（用户确认）
用户选择：新增题的 `analysis` 不写 repo/path/章节等来源信息，仅保留必要解析/要点。

---

## 2. 目标产物

### 2.1 落地文件
- **唯一落地**：`src/data/questionBank.local.json`
- 内容为 `Question[]` 数组

### 2.2 新增数量
- 新增约 **300** 道题（严格 300 条，便于验收与后续增量扩题）。

### 2.3 题型占比
- 用户要求：**按当前题库题型占比**（choice/judge/card 的现有比例）
- 执行时：先统计当前 `QUESTION_BANK` 的各类型数量与比例 → 按比例分配 300 的数量（四舍五入，保证总和=300）。

### 2.4 ID 分配策略（防冲突）
推荐使用独立 id 段，避免与当前 100~900 段冲突：
- 本次新增：`100001 ~ 100300`
- 以后继续扩题：顺延递增（例如 100301+）。

---

## 3. 从 GitHub 内容到题库的生成策略

### 3.1 输入仓库
- `haizlin/fe-interview`
- `febobo/web-interview`
- `pwstrick/daily`

### 3.2 总体策略（质量优先的半自动方案）
采用“半自动抽取 + 结构化生成”的流程，避免纯模板批量生成导致水题/重复题。

#### 阶段 A：抽取
- 从仓库中读取可题库化内容：
  - 面试问答
  - 概念/对比总结
  - 代码片段（适合手写/复盘）
  - 浏览器/网络/工程化/性能优化要点

#### 阶段 B：结构化（候选知识点池）
把内容切成候选条目（中间形态），每条包含：
- 文本要点（可生成题干/选项/答案）
- 建议模块（落到 MODULES）
- 建议题型（choice/judge/card）

并做初步清洗：
- 去掉过短/无实义条目（纯目录、标题噪声）
- 合并明显重复条目
- 统一常见术语与口径（例如：微任务/宏任务、CORS 预检、Tree Shaking 条件等）

#### 阶段 C：题型化（生成 Question）
按既定题型配比生成 300 条 `Question`：
- **choice（主力）**：
  - 4 个选项为主
  - 干扰项来自常见误区/边界条件/概念混淆
  - `answer` 为正确选项索引
- **judge**：
  - 更偏“绝对化表述 + 边界陷阱”的判断
  - `answer` 为 boolean
- **card**：
  - 手写代码 / 场景回答模板 / 排查 checklist
  - `answer` 为 string（可多行）

#### 阶段 D：去重与落库
- 严格写入 `id=100001..100300`
- 同义重复/跨仓库重复：只保留一题（更典型、更可考）
- 与现有题库重复：若角度完全相同则跳过；否则换角度加深再加入

---

## 4. 质量规则（验收时可检查）

每题至少满足其一：
- 能区分“懂/不懂”（不是纯记忆名词）
- 有明确答案（choice/judge）或可讲清楚/可执行的参考答案（card）
- `analysis` 能解释“为什么”并指出关键点/易错点

且必须满足：
- 字段完整且类型正确
- `module` 命中 `MODULES`
- `id` 唯一且与现有不冲突

---

## 5. 验收标准

1) **数量**：`questionBank.local.json` 中新增题数量 == 300
2) **题型占比**：新增题的 choice/judge/card 占比 ≈ 当前 `QUESTION_BANK` 占比
3) **模块合法**：所有新增题的 `module` 均在 `MODULES` 内
4) **可运行**：
   - `npm run test` 全通过
5) **体验验证**：
   - 首页“换一批”会影响练习题抽样
   - 错题/收藏列表不受换一批影响（依赖 snapshot 存储）

---

## 6. 非目标（本次不做）
- 不引入远程题库
- 不新增 UI 用于“来源追溯”
- 不新增新的模块名（避免被过滤）
