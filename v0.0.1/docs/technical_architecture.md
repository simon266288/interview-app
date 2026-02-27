# v0.0.1 技术架构快照（单文件版）

## 技术栈
- Vue 3（CDN，全局构建版）
- Tailwind CSS（CDN）
- FontAwesome（CDN）
- 运行环境：现代浏览器（Chrome/Edge/Safari/Firefox，移动端优先）

## 文件结构
- `index.html`：唯一入口，包含：
  - `<style>`：自定义样式（卡片翻转、选项震动、滚动条隐藏等）
  - `<script>`：Vue 3 逻辑、题库数据、状态管理、组件定义

## 代码结构（逻辑）
- 模块常量：`MODULES`
- 题库数组：`QUESTION_BANK`（硬编码）
- 全局状态：`store`（Vue `reactive`）
  - 视图状态：`view`（home/modules/quiz/result/cards/errors/favorites）
  - 会话状态：`currentQuestions/currentIndex/userAnswers/examMode`
  - 持久化数据：`progress`（completedIds/wrongIds/favoriteIds/moduleStats/examHistory）
- 持久化：`localStorage`（键：`interview_app_v1`）
- 视图组件：内联对象（`HomeView/ModuleListView/QuizView/ExamResultView/QuestionListView`）
- 简易路由：通过 `store.view` 切换当前组件（`<component :is="currentViewComponent">`）

## 交互与业务规则
- 专项练习：
  - 从模块页筛选题目进入 `QuizView`
  - 非卡片题：选择后立即反馈并展示解析；更新进度与错题本
  - 记忆卡片：点击翻转，用户标记“记住了/没记住”，更新进度与错题本
- 错题本/收藏夹：
  - 按 ID 映射题目列表，可从列表进入刷题
  - 支持单条删除
- 模拟考试：
  - 随机抽取 20 题进入 `examMode`
  - 交卷后进入结果页，展示分数与答题卡概览（解析点击提示“开发中”）
- 收藏：
  - `favoriteIds` 切换，刷新后持久化生效

## 性能与兼容
- 资源通过公共 CDN 加载
- 数据写入 `localStorage`（无防抖）
- 动画与动效：CSS 过渡（flip/shake）

## 测试与验证
- 手工验证：
  - 专项练习：各模块题目渲染与判题正确
  - 错题本/收藏夹：列表操作与刷题入口正常
  - 模拟考试：抽题、交卷、得分正常
  - 刷新后：错题与收藏不丢失

## 限制
- 无正式单元测试与端到端测试
- 无构建管线与工程化分层
- 考试倒计时组件未实现（v0.0.2 规划中）
