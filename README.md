<div align="center">

# LunaBox Plugins

Official plugins, project templates and the AI coding skill for [LunaBox](https://github.com/Saramanda9988/LunaBox) plugin development.

[中文](README.zh-CN.md) | English

</div>

LunaBox plugins are small JavaScript / TypeScript packages that run inside LunaBox. They can add pages and side drawers, extend the game detail page, change the theme, add metadata sources, react to game launches, open floating windows and build AI tools on top of your game library. The UI is drawn natively by LunaBox from components in the `lunabox` SDK, so plugins look and feel like the rest of the app.

> [!NOTE]
> The `lunabox` SDK package is not on npm yet. Until it is, use a local clone of the [LunaBox repository](https://github.com/Saramanda9988/LunaBox):
>
> 1. Run `pnpm install` in `<LunaBox>/packages/plugin-sdk`.
> 2. Replace `npx -p lunabox lunabox-plugin` below with `node <LunaBox>/packages/plugin-sdk/bin/lunabox-plugin.mjs`.
> 3. In the new plugin project, run `npm install -D <LunaBox>/packages/plugin-sdk` before `npm install`.

## What's in this repository

| Directory | Contents |
| --- | --- |
| [`templates/`](templates) | Starter projects used by `lunabox-plugin init` |
| [`examples/`](examples) | Official plugins, also useful as larger references |
| [`skills/`](skills) | The `lunabox-plugin` skill that teaches AI coding agents the SDK |

## Create a plugin

```bash
npx -p lunabox lunabox-plugin init my-plugin
```

The CLI asks for a template, a plugin id and a display name, copies the template from this repository (no git needed), and offers to install the AI skill. Then:

```bash
cd my-plugin
npm install
npm run build        # src/index.tsx -> main.js
```

In LunaBox, open **Plugins → Add dev directory** and pick the `my-plugin` folder. LunaBox reloads the plugin whenever the folder changes, so rebuilding is enough to see your edits. When you are ready to share it, `npm run release` builds a minified bundle and packs `<id>-<version>.zip`, which users install from the Plugins page.

Useful options: `--template=<name>`, `--id=<id>`, `--name=<display name>`, `--yes` (no prompts), `--no-skills`. Set `GITHUB_TOKEN` if you hit the GitHub API rate limit.

### Templates

| Template | Shows how to |
| --- | --- |
| [`basic`](templates/basic) (default) | Add a sidebar page, a settings form, translations and local storage |
| [`game-detail`](templates/game-detail) | Add a game detail tab and side panel backed by the plugin's own SQLite database, plus a game context-menu action with a confirmation dialog |
| [`theme`](templates/theme) | Override the accent colors and global corner radius, applied live when settings change |
| [`metadata-source`](templates/metadata-source) | Register a new metadata source with search, fetch by id, id normalization and rate limiting (uses the public VNDB API) |
| [`overlay`](templates/overlay) | Open an always-on-top transparent window when a game starts and close it when the session ends, with a top bar toggle |
| [`ai-chat`](templates/ai-chat) | Build a streaming AI chat in the side drawer with tools that query the game library, using the model configured in LunaBox |

## AI coding skill

The [`lunabox-plugin`](skills/lunabox-plugin/SKILL.md) skill gives Claude Code, Cursor, Codex and other agents the SDK rules, components, slots, `ctx` APIs, theme tokens and common patterns. `init` offers to install it; to add it to an existing project:

```bash
npx skills add Saramanda9988/LunaBox-plugins
```

## Official plugins

| Plugin | Description |
| --- | --- |
| [`ai-agent`](examples/ai-agent) | An AI library assistant in the style of Claude / Codex desktop: streaming replies, expandable tool calls, library queries and edits, scraping web pages into the library, and commands that need confirmation. Bundles [pi](https://github.com/earendil-works/pi) and supports OpenAI-compatible and Anthropic endpoints |
| [`hikarinagi-detail`](examples/hikarinagi-detail) | Redesigns the game detail page with Hikarinagi data: full-width hero image and transparent logo, native launch bar, a screenshot gallery and a detailed info panel, cached in SQLite |
| [`hikarinagi-theme`](examples/hikarinagi-theme) | Recolors LunaBox in Hikarinagi's Hina UI style: neutral grays, hairline dividers and a teal accent for light and dark themes, with a translucent sidebar on Windows 11 and macOS |
| [`pomodoro-overlay`](examples/pomodoro-overlay) | A floating window that shows the current play time and a pomodoro focus / break timer when a game starts |
| [`whale-pet`](examples/whale-pet) | A bouncy whale in the bottom-left corner of the window, with a squish animation and sound effects when you press it |

To try one, clone this repository and add the plugin's folder in **Plugins → Add dev directory**.

## Documentation

- [Plugin SDK reference](https://github.com/Saramanda9988/LunaBox/blob/main/docs/plugin-sdk.md): manifest, CLI, components, slots and every `ctx` API
- [Plugin system design](https://github.com/Saramanda9988/LunaBox/blob/main/docs/plugin-system.md): how plugins are loaded, isolated and rendered
- The types in `node_modules/lunabox/src/types.ts` are the exact source of truth for every API

## Contributing

Templates follow a few rules so `init` can use them:

- Each template is a complete project in `templates/<name>/` with a `plugin.json`. Its `description` is what `init` shows in the template list.
- Commit sources only. `main.js`, `node_modules/` and `*.zip` are ignored, and `init` skips them when copying.
- Put user-facing text in `locales/zh-CN.json` and `locales/en-US.json`.
- Run `npm run typecheck` and `npm run build`, then load the result in LunaBox before opening a pull request.

When the SDK changes, update the skill in [`skills/lunabox-plugin/`](skills/lunabox-plugin) along with the templates.
