# 插槽与事件

## `ctx.ui.slot(name, def): Disposer`

```ts
interface SlotDef {
  id: string;                          // 插件内唯一
  title?: string;                      // 菜单、标签页、按钮的文字（用 ctx.i18n.t 取）
  icon?: string;                       // MDI 图标名
  group?: 'main' | 'bottom';           // sidebar.page 放在侧边栏上方还是底部
  badge?: string;
  mode?: 'normal' | 'batch' | 'both';  // library.toolbar：普通模式、批量选择模式或都显示
  defaultWidth?: number;               // workspace.drawer 默认宽度
  order?: number;                      // game.detail.tab：<0 成为打开详情页时的默认标签，>0 排在内置标签前面
  hideTabs?: string[];                 // game.detail.*：隐藏内置标签页，如 ['progress']
  render?: (props: any) => VNode;      // 有界面的插槽
  onPress?: (payload?: any) => void | Promise<void>; // 按钮类插槽
  run?: (game: Game) => void | Promise<void>;         // game.actions
  when?: (game: Game) => boolean;                     // game.actions：是否对这款游戏显示
}
```

| 插槽 | 位置 | 用法 |
| --- | --- | --- |
| `sidebar.page` | 侧边栏里的独立页面 | `title`、`icon`、`group`、`badge`、`render()` |
| `workspace.drawer` | 全局右侧抽屉 | `defaultWidth`、`render(props)`；用 `ctx.ui.openDrawer(id, props)` 打开，`props` 原样传给 render |
| `topbar.item` | 主窗口顶栏按钮 | `title`、`icon`、`onPress()` |
| `library.add_menu` | 游戏库「添加游戏」下拉菜单 | `title`、`icon`、`onPress()` |
| `library.toolbar` | 游戏库工具栏 | `mode`、`title`、`icon`、`onPress({ selectedGameIds })`（批量模式下是选中的游戏 id） |
| `game.detail.hero` | 详情页顶部整块头图（接管原生头图） | `render({ game, gameId, blurNsfw, contentMaxWidth, safeTop })`、`hideTabs`；通常用 `HeroBanner` + `NativeSlot` |
| `game.detail.header` | 详情页原有页头下方的扩展区 | `render({ game, gameId, blurNsfw })` |
| `game.detail.tab` | 详情页新标签页 | `title`、`icon`、`order`、`hideTabs`、`render({ game, gameId, blurNsfw })` |
| `game.detail.aside` | 详情页右侧信息栏（窄窗口时移到底部） | `render({ game, gameId, blurNsfw })` |
| `game.actions` | 游戏卡片右键菜单、详情页「更多」菜单 | `title`、`icon`、`when(game)`、`run(game)` |
| `downloads.header` | 下载页顶部 | `render()` |
| `app.decoration` | 全局前景 / 背景装饰层 | 参数同 `ctx.theme.registerDecoration` |
| `settings.section` | 插件详情页里的自定义设置区 | `title`、`icon`、`render()`；普通表单用 `ctx.config.define` 即可 |

`blurNsfw` 表示用户开启了 NSFW 模糊，显示成人内容图片时应遵守（`Image blur`）。

详情页插槽里可以用 `NativeSlot` 嵌入宿主的返回按钮、封面、启动栏、标签与简介，见 [components.md](components.md)。

## `ctx.on(event, listener, opts?): Disposer`

`opts`：`prepend`（排在其他插件前面执行）、`timeout`（拦截器超时，默认 3 秒，最多 10 分钟）。

| 事件 | 类型 | 载荷 | 返回值 |
| --- | --- | --- | --- |
| `app/ready` | 通知 | 无 | |
| `game/added` / `game/updated` | 通知 | `Game` | |
| `game/deleted` | 通知 | `{ id }` | |
| `launch/prepare` | 拦截器 | `{ game, options: LaunchOptions }` | `{ options }` 修改启动选项；`{ cancel: true, reason? }` 取消启动 |
| `launch/plan` | 拦截器 | `{ game, plan: LaunchPlan }` | `{ plan }` 修改 `file` / `args` / `dir` / `env` / `run_as_admin`；`{ cancel: true, reason? }` 取消 |
| `game/before-launch` | 通知 | `{ game, plan }` | 拦截器都执行完，进程即将启动 |
| `game/launched` | 通知 | `{ game, sessionId }` | |
| `game/running` | 通知 | `{ game, sessionId, pid, processName, reason }` | 识别到实际的游戏进程 |
| `session/ended` | 通知 | `{ gameId, sessionId, duration }`（秒） | |
| `metadata/before-search` | 依次传递 | `{ name, source }` | `{ name }` 改写搜索词 |
| `metadata/after-fetch` | 依次传递 | `{ source, result: MetadataResult }` | 返回新的 `MetadataResult` |

拦截器的返回值会深合并进载荷（数组整体替换），多个插件按顺序执行，有一个返回 `cancel: true` 就停止。载荷里的 `game` 是只读的，改游戏数据用 `ctx.games.update`。`LaunchPlan.env` 在 Windows 上不生效（游戏经 ShellExecuteEx 启动）。

需要等用户选择时放宽超时：

```ts
ctx.on('launch/plan', async ({ game, plan }) => {
  if (!plan.file.toLowerCase().endsWith('steam.exe')) return;
  const login = await ctx.ui.select({
    title: `用哪个账号启动《${game.name}》？`,
    options: accounts.map((a) => ({ value: a.login, label: a.name })),
  });
  if (login === null) return { cancel: true, reason: '已取消' };
  return { plan: { args: [...plan.args, '-login', login] } };
}, { timeout: 120_000 });
```
