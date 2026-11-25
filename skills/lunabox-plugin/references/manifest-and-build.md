# 清单、构建与发布

## `plugin.json`

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `id` | 是 | 小写字母开头，只含小写字母、数字和 `-`，最长 64；同时决定数据目录 `plugins-data/<id>/` |
| `version` | 是 | SemVer，如 `"1.0.0"` |
| `apiVersion` | 是 | 插件 API 主版本，当前为 `1` |
| `name` | 是 | 多语言名称 `{ "zh-CN": "…", "en-US": "…" }` |
| `main` | | 入口文件，默认 `main.js` |
| `engines` | | `{ "lunabox": ">=2.1.0 <3" }`，要求的宿主版本 |
| `description` | | 多语言简介 |
| `author`、`homepage`、`repository`、`license` | | |
| `icon` | | 插件目录内的图片路径（如 `assets/icon.svg`）或 MDI 图标名 |
| `iconBg` | | 图标底色，如 `#fef2f2` |
| `keywords` | | 关键词 |

依赖了新版宿主才有的事件、组件或属性时，提高 `engines.lunabox` 的下限。

## 多语言

`locales/<语言>.json`，文件名就是语言代码（`zh-CN`、`zh-TW`、`en-US`、`ja-JP`）。内容可以嵌套，嵌套的键用点号访问：

```json
{ "notes": { "saved": "《{name}》的笔记已保存" } }
```

```ts
ctx.i18n.t('notes.saved', { name: game.name });
```

找不到时依次尝试同前缀语言（`zh-TW` 缺失时用 `zh-CN`）、`en-US`、`en`，都没有就返回键本身。插槽标题等在 `apply` 里取一次即可；需要随语言切换刷新的界面可以订阅 `ctx.i18n.onChange`。

## 构建

```bash
lunabox-plugin build [dir] [--minify] [--platform=browser|neutral]
```

- 入口按顺序找 `src/index.tsx`、`src/index.ts`、`src/main.tsx`、`src/main.ts`、`index.tsx`、`index.ts`，输出到清单的 `main`。
- esbuild 打包成单个 ESM 文件（`target: es2022`），npm 依赖全部打进去；`lunabox`、`lunabox/jsx-runtime`、`node:buffer` 保持 external，由宿主提供。
- 默认 `platform: browser`，让 OpenAI / Anthropic SDK 等依赖选用浏览器实现。
- 也可以不用构建：直接手写 ESM 的 `main.js`，用函数写法调用组件（`Column({ gap: 'md', children: [...] })`）。

`tsconfig.json` 需要：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "lunabox",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

## 开发与调试

1. `npm run build` 生成 `main.js`。
2. LunaBox「插件」页 →「添加开发目录」，选中插件目录。
3. 之后每次重新构建，宿主在文件变化 200 ms 后自动重载插件。
4. 日志看 LunaBox 应用日志（`ctx.logger`）；加载失败的原因显示在插件页。

## 打包发布

```bash
lunabox-plugin pack [dir]     # 生成 <id>-<version>.zip
```

zip 里包含 `plugin.json`、入口文件、`locales/`、`assets/`，以及清单 `icon` 指向的文件（不在 `assets/` 下时）。`src/`、`node_modules/` 不会打包，运行时需要的资源都放进 `assets/`。用户在 LunaBox「插件」页安装 zip。

发布前：

- 用 `--minify` 构建并测一遍 zip 安装，而不只是开发目录。
- 升级 `version`；改了元数据源 id 或数据表结构时，要兼容旧数据。
- 插件仓库加 GitHub topic `lunabox-plugin`，方便被发现。
