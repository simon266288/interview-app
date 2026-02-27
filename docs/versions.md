# 版本目录说明

- `v0.0.1/`：重构前的单文件版本（index.html）
  - 访问（本地预览服务器）：`http://localhost:8000/v0.0.1/index.html`

- `v0.0.2/`：当前主开发版本（工程化）
  - 技术栈：Vue 3 + TypeScript + Vite + Pinia + Vue Router + Tailwind CSS
  - 源码目录：`v0.0.2/src`
  - 测试目录：`v0.0.2/tests`（unit / component / e2e）
  - 构建目录：`v0.0.2/dist`
  - 常用命令（在 `v0.0.2` 下执行）：
    - 开发：`npm run dev -- --host 127.0.0.1 --port 5173`
    - 单元+组件测试：`npm test`
    - E2E：`npm run e2e`
    - 打包：`npm run build`

## 现状

- `v0.0.2` 已完成工程化落地并可运行。
- 当前版本已通过：
  - `npm test`
  - `npm run build`
  - `npm run e2e`
