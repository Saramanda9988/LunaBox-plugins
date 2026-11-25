---
name: lunabox-plugin
description: 编写、修改、调试和打包 LunaBox 插件（`lunabox` SDK）：插槽 ctx.ui.slot、宿主 API ctx.*、TSX 描述树组件、主题 ctx.theme、元数据源 ctx.metadata、事件钩子 ctx.on、悬浮窗 ctx.window、AI 对话。Use when working on a LunaBox plugin — a project with plugin.json and `import ... from 'lunabox'` — or when the user asks to build a LunaBox plugin or mentions lunabox-plugin.
---

# LunaBox 插件开发

LunaBox 是 Galgame / 视觉小说游戏库桌面应用。插件是一个目录：`plugin.json` + 打包好的 ESM 入口 `main.js`，由宿主内嵌的 JS 引擎（moejs）加载，界面由宿主用原生组件绘制。

## 先记住运行环境

- **不是 Node，也不是浏览器 DOM。** 可用：ES2022、全局 `fetch`（走宿主代理、自动带 LunaBox 的 User-Agent）与 `Headers` / `Request` / `Response` / `ReadableStream`、`setTimeout` / `setInterval` / `queueMicrotask`、`AbortController`、`URL` / `URLSearchParams`、`TextEncoder` / `TextDecoder`、`atob` / `btoa`、`structuredClone`、`crypto.randomUUID` / `getRandomValues`、`Blob` / `FormData`（`fetch` 不支持 multipart 上传）、`Buffer`。没有 `require`、`process` 和 `fs` / `path` / `child_process` 等 Node 模块，没有 `document` / `window` / `localStorage`，也没有 `EventSource` / `WebSocket`（SSE 用 `ctx.http.sse`）。文件和进程分别用 `ctx.fs`、`ctx.process`。
- **界面不是 HTML / React。** 组件函数返回描述树，只能用 SDK 导出的原语（`Column`、`Row`、`Text`、`Button`……共 32 个）加 `HeroBanner`、`NativeSlot`。没有 `className`、`style`、CSS，也不能用 React 组件库。布局和配色全靠组件属性与设计令牌，见 [references/components.md](references/components.md)。
- **npm 依赖可以用**，`lunabox-plugin build` 会把它们打进 `main.js`（`platform: browser`，`lunabox` 由宿主提供、保持 external）。依赖 Node API 的包在运行时会失败。

## 项目结构与命令

```text
my-plugin/
├── plugin.json        # 清单：id、version、apiVersion: 1、多语言 name/description、icon……
├── package.json       # devDependencies: lunabox、esbuild、typescript
├── tsconfig.json      # jsx: react-jsx，jsxImportSource: lunabox
├── src/index.tsx      # 入口，导出 apply(ctx)
├── locales/           # zh-CN.json、en-US.json……（ctx.i18n.t 读取）
└── assets/            # 图片、音频、字体（相对插件目录引用）
```

```bash
npx -p lunabox lunabox-plugin init my-plugin   # 从模板新建（basic、game-detail、theme、metadata-source、overlay、ai-chat）
npm run build        # = lunabox-plugin build，src/index.tsx → main.js
npm run typecheck    # tsc --noEmit
npm run release      # 压缩构建并打包 <id>-<version>.zip
```

开发时在 LunaBox「插件」页「添加开发目录」选中插件目录；宿主监听这个目录，文件变化 200 ms 后自动重载插件，所以改完代码只需重新 `npm run build`。

清单字段、CLI 参数和打包规则见 [references/manifest-and-build.md](references/manifest-and-build.md)。

## 必须遵守

1. **入口是具名导出 `apply`**：`export function apply(ctx: Context) { ... }`（可以是 async，10 秒内必须返回）。`export default function setup()` 不会被调用，宿主会报「插件未导出 apply(ctx) 函数」。
2. **注册即回收**：`ctx.ui.slot`、`ctx.on`、`ctx.theme.extend`、`ctx.config.define`、`ctx.metadata.registerSource`、`ctx.window.open` 等都返回 `Disposer`，插件停用或重载时宿主自动回收，插件打开的窗口也会关闭。只有要提前撤销时才手动调用（例如设置变了，先撤销旧主题再注册新主题）。
3. **组件与 hooks**：组件是普通函数，`useState` / `useEffect` / `useRef` / `useMemo` 只能在渲染期间调用。列表里的元素要给稳定的 `key`（TSX）或 `k`（函数写法 `Text({ k: 'x', ... })`）。同一微任务里的多次 `setState` 合并成一次提交。`useEffect` 返回的清理函数在卸载时执行，`ctx.config.onChange` 之类返回的 `Disposer` 可以直接作为清理函数返回。
4. **跨组件、跨事件的状态**放在插件级 store（闭包变量 + 订阅集合），组件在 `useEffect` 里订阅后 `setState` 触发重渲染。写法见 [references/recipes.md](references/recipes.md)。
5. **文案走 i18n**：`locales/<语言>.json`（可嵌套，键用点号访问），`ctx.i18n.t('notes.saved', { name })`，占位符写成 `{name}`。找不到时依次回退到同前缀语言、`en-US`、`en`，最后返回键本身。`plugin.json` 的 `name` / `description` 用 `{ "zh-CN": "…", "en-US": "…" }`。
6. **颜色用语义令牌**：`tone`、`surface`、颜色令牌（`accent`、`textMuted`、`cardBg`……）会跟随明暗主题、玻璃模式和主题插件；需要不同明暗取值时写 `{ light, dark }`。不要硬编码一套只在某个主题下好看的颜色。
7. **设置优先用 `ctx.config.define`**，宿主会在插件详情页自动渲染表单并持久化；`settings.section` 插槽只在需要自定义界面时使用。密钥类字段用 `type: 'secret'`。
8. **会改用户数据或系统的操作先确认**：删除游戏、批量修改、`ctx.process.exec` / `spawn` 之前调用 `ctx.ui.confirm`，命令要完整展示给用户。
9. **描述树有上限**：深度 64、节点 2000、单个字符串 64 KiB。长列表用 `createPagination` + `ScrollArea onReachBottom` 分页，长对话只渲染最近的消息。
10. **持久化**：小的键值状态用 `ctx.storage`，结构化数据和接口缓存用 `ctx.db`（插件独立的 SQLite，支持事务），文件放 `ctx.paths.data`。

## 需求 → 扩展点

| 想做的事 | 用什么 |
| --- | --- |
| 侧边栏里的独立页面 | `ctx.ui.slot('sidebar.page', { id, title, icon, render })` |
| 全局右侧抽屉 | `workspace.drawer` + `ctx.ui.openDrawer(id, props)` |
| 顶栏按钮 | `topbar.item`（`onPress`） |
| 游戏详情页加标签页 / 右侧信息栏 / 页头 / 整个头图 | `game.detail.tab` / `game.detail.aside` / `game.detail.header` / `game.detail.hero`（配合 `NativeSlot`、`HeroBanner`） |
| 游戏右键菜单 | `game.actions`（`when(game)`、`run(game)`） |
| 游戏库工具栏、批量操作 | `library.toolbar`（`mode: 'batch'` 时 `onPress({ selectedGameIds })`） |
| 「添加游戏」菜单项 | `library.add_menu` |
| 自定义设置界面 | `ctx.config.define`；复杂界面用 `settings.section` |
| 改配色、圆角、字标、侧边栏材质 | `ctx.theme.extend(defineThemePreset({...}))`，见 [references/theme.md](references/theme.md) |
| 角色立绘、水印等装饰层 | `ctx.theme.registerDecoration` 或 `app.decoration` 插槽 |
| 新的刮削来源 | `ctx.metadata.registerSource({ id, name, fetch, search, ... })` |
| 改写刮削结果、搜索词 | `ctx.on('metadata/after-fetch' / 'metadata/before-search')` |
| 启动前修改参数或拦截 | `ctx.on('launch/prepare' / 'launch/plan')`，返回 `{ cancel: true }` 取消 |
| 游戏启动 / 结束时做事 | `ctx.on('game/launched')`、`ctx.on('session/ended')` |
| 置顶悬浮窗、桌宠 | `ctx.window.open(id, { frameless, transparent, alwaysOnTop, render })`，可拖动区域加 `dragWindow` |
| 读写游戏库 | `ctx.games.*`、`ctx.categories.*` |
| 下载并入库 | `ctx.downloads.requestInstall` |
| AI 对话 | 简单对话：`createAIChatStore(ctx, { system, tools, onToolCall })`；完整 agent：打包 pi，用 `ctx.ai.getCredentials()` |

插槽的参数与 render props 见 [references/slots-and-events.md](references/slots-and-events.md)，`ctx` 全部服务见 [references/context-api.md](references/context-api.md)。

## 不确定签名时

类型定义是唯一准确的来源：项目里的 `node_modules/lunabox/src/types.ts`（`Context`、`SlotName`、`SlotDef`、各组件的 `*Props`、`EventMap`、`ThemePaletteTokens`、`Game`）。写代码前先搜它，不要凭印象猜属性名；改完跑 `npm run typecheck`。

## 调试

- `ctx.logger.info / warn / error` 写入 LunaBox 应用日志。
- `apply` 抛错或加载失败时，插件页会显示插件状态与最后一条错误；渲染出错时错误显示在对应插槽的占位里。
- 常见问题：
  - 「插件未导出 apply(ctx) 函数」：入口没有具名导出 `apply`。
  - 打包或运行时报找不到 `fs` / `path` / `process`：用了 Node 模块，改用 `ctx.fs` / `ctx.process` 或换掉依赖。
  - 界面不更新：在闭包里改了普通变量却没有 `setState`；或者共享状态没有通知订阅者。
  - 列表错乱、输入框丢焦点：列表项缺少稳定的 `key`。

## 参考

- [references/components.md](references/components.md)：32 个原语与 `HeroBanner` 的属性、设计令牌、颜色写法
- [references/slots-and-events.md](references/slots-and-events.md)：13 个插槽、`SlotDef`、`NativeSlot`、事件与拦截器
- [references/context-api.md](references/context-api.md)：`ctx` 的全部服务
- [references/theme.md](references/theme.md)：主题令牌、圆角、品牌标志、材质、字体与装饰
- [references/recipes.md](references/recipes.md)：共享状态、设置驱动的重新注册、SQLite 缓存、分页、AI 工具调用等常用写法
- [references/manifest-and-build.md](references/manifest-and-build.md)：`plugin.json` 字段、CLI 与打包
