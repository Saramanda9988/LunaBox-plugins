<div align="center">

# LunaBox Plugins

[LunaBox](https://github.com/Saramanda9988/LunaBox) 的官方插件、插件项目模板，以及教 AI 编程助手写插件的 skill。

中文 | [English](README.md)

</div>

LunaBox 插件是运行在 LunaBox 里的 JavaScript / TypeScript 小程序，可以新增页面和侧边抽屉、扩展游戏详情页、更换主题、接入新的元数据源、响应游戏启动、打开悬浮窗，或者基于游戏库做 AI 工具。界面由 LunaBox 用 `lunabox` SDK 的组件原生绘制，和应用其他部分风格一致。

> [!NOTE]
> `lunabox` SDK 还没有发布到 npm。在那之前，请使用本地克隆的 [LunaBox 仓库](https://github.com/Saramanda9988/LunaBox)：
>
> 1. 在 `<LunaBox 目录>/packages/plugin-sdk` 里运行 `pnpm install`。
> 2. 把下文的 `npx -p lunabox lunabox-plugin` 换成 `node <LunaBox 目录>/packages/plugin-sdk/bin/lunabox-plugin.mjs`。
> 3. 在新建的插件项目里，先运行 `npm install -D <LunaBox 目录>/packages/plugin-sdk`，再运行 `npm install`。

## 仓库内容

| 目录 | 内容 |
| --- | --- |
| [`templates/`](templates) | `lunabox-plugin init` 使用的项目模板 |
| [`examples/`](examples) | 官方插件，也可以当作更完整的参考 |
| [`skills/`](skills) | 教 AI 编程助手使用 SDK 的 `lunabox-plugin` skill |

## 新建插件

```bash
npx -p lunabox lunabox-plugin init my-plugin
```

CLI 会询问模板、插件 id 和显示名称，从本仓库下载模板（不需要 git），最后询问是否安装 AI skill。然后：

```bash
cd my-plugin
npm install
npm run build        # src/index.tsx -> main.js
```

在 LunaBox 打开「插件」页，点「添加开发目录」选中 `my-plugin` 文件夹。目录有变化时 LunaBox 会自动重载插件，改完代码重新构建就能看到效果。准备分享时运行 `npm run release`，会压缩构建并打包出 `<id>-<version>.zip`，用户在「插件」页安装即可。

常用参数：`--template=<模板名>`、`--id=<插件 id>`、`--name=<显示名称>`、`--yes`（不询问）、`--no-skills`。遇到 GitHub API 限流时设置 `GITHUB_TOKEN`。

### 模板

| 模板 | 演示内容 |
| --- | --- |
| [`basic`](templates/basic)（默认） | 侧边栏页面、设置表单、多语言、本地存储 |
| [`game-detail`](templates/game-detail) | 游戏详情页新增标签页与右侧信息栏，数据存入插件独立的 SQLite；游戏右键菜单与确认对话框 |
| [`theme`](templates/theme) | 覆盖强调色与全局圆角，修改设置后立即生效 |
| [`metadata-source`](templates/metadata-source) | 注册新的元数据源：搜索、按 ID 抓取、ID 规范化与限流（示例对接 VNDB 公开 API） |
| [`overlay`](templates/overlay) | 游戏启动时打开置顶透明小窗，游玩结束时关闭，并提供顶栏开关 |
| [`ai-chat`](templates/ai-chat) | 右侧抽屉里的流式 AI 对话，带查询游戏库的工具，使用 LunaBox 设置里配置的模型 |

## AI 编程 skill

[`lunabox-plugin`](skills/lunabox-plugin/SKILL.md) skill 为 Claude Code、Cursor、Codex 等 AI 编程助手提供 SDK 的使用规则、组件、插槽、`ctx` 接口、主题令牌和常用写法。`init` 时可以顺带安装；给已有项目安装：

```bash
npx skills add Saramanda9988/LunaBox-plugins
```

## 官方插件

| 插件 | 简介 |
| --- | --- |
| [`ai-agent`](examples/ai-agent) | 类 Claude / Codex 桌面端的 AI 游戏库助手：流式回复、可展开的工具调用，能查询与整理游戏库、刮削网页信息入库、执行命令（需确认）。内置 [pi](https://github.com/earendil-works/pi)，支持 OpenAI 兼容与 Anthropic 接口 |
| [`hikarinagi-detail`](examples/hikarinagi-detail) | 用 Hikarinagi 数据重构游戏详情页：全宽头图与透明徽标、保留原生启动栏、截图画廊与完整信息栏，SQLite 本地缓存 |
| [`hikarinagi-theme`](examples/hikarinagi-theme) | 按 Hikarinagi 的 Hina UI 风格重新配色：中性灰、发丝线分隔与青色强调色，适配浅色与深色主题；Windows 11 与 macOS 上侧边栏为半透明磨砂材质 |
| [`pomodoro-overlay`](examples/pomodoro-overlay) | 游戏启动时弹出置顶悬浮窗，显示本次游玩时长与番茄钟专注 / 休息倒计时 |
| [`whale-pet`](examples/whale-pet) | 窗口左下角的 Q 弹小鲸鱼，点击或按住有弹簧压扁动画和音效 |

想试用时，克隆本仓库，在「插件 → 添加开发目录」选中对应插件的文件夹。

## 文档

- [插件 SDK 参考](https://github.com/Saramanda9988/LunaBox/blob/main/docs/plugin-sdk.md)：清单、CLI、组件、插槽与全部 `ctx` 接口
- [插件系统设计](https://github.com/Saramanda9988/LunaBox/blob/main/docs/plugin-system.md)：插件如何加载、隔离与渲染
- 所有接口的精确定义以 `node_modules/lunabox/src/types.ts` 为准

## 参与贡献

模板需要遵守几条约定，`init` 才能正常使用：

- 每个模板是 `templates/<name>/` 下的完整项目，必须有 `plugin.json`；其中的 `description` 会显示在 `init` 的模板列表里。
- 只提交源码。`main.js`、`node_modules/`、`*.zip` 已被忽略，`init` 复制时也会跳过。
- 界面文字放在 `locales/zh-CN.json` 和 `locales/en-US.json`。
- 提交 PR 前运行 `npm run typecheck` 和 `npm run build`，并在 LunaBox 里实际加载一次。

SDK 有变化时，请同时更新 [`skills/lunabox-plugin/`](skills/lunabox-plugin) 里的 skill 和模板。
