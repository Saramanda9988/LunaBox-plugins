# `ctx` 宿主 API

`apply(ctx)` 收到的上下文对象。下面列出全部服务；参数与返回值的精确类型见 `node_modules/lunabox/src/types.ts` 里的 `interface Context`。返回 `Promise` 的方法都是异步调用宿主，失败时 reject。

## 基础

```ts
ctx.logger.info / warn / error(...args)          // 写入 LunaBox 应用日志
ctx.i18n.language / getLanguage()                // 当前界面语言，如 'zh-CN'
ctx.i18n.t(key, args?)                           // 读 locales/<语言>.json，占位符 {name}
ctx.i18n.onChange(fn: (lang) => void): Disposer  // 用户切换语言
ctx.paths.plugin                                 // 插件目录（读取 assets 用）
ctx.paths.data                                   // 插件专属数据目录 plugins-data/<id>/
ctx.effect(setup: () => void | Disposer): Disposer // 登记一个随插件回收的副作用（定时器、订阅等）
```

## 存储

```ts
// 键值存储：同步读写，适合小状态
ctx.storage.get<T>(key): T | undefined
ctx.storage.set(key, value)       // value 需可 JSON 序列化
ctx.storage.delete(key)
ctx.storage.keys(): string[]

// 插件独立的 SQLite（plugins-data/<id>/plugin.db），第一次调用时创建
ctx.db.exec(sql, params?): Promise<{ rowsAffected, lastInsertId }>
ctx.db.query<T>(sql, params?): Promise<T[]>
ctx.db.queryOne<T>(sql, params?): Promise<T | null>
ctx.db.transaction([{ sql, params? }, ...])   // 原子执行，任一失败全部回滚
```

建表用 `CREATE TABLE IF NOT EXISTS`，在 `apply` 里发起一次并保存 Promise，查询前 `await` 它。

## 设置

```ts
ctx.config.define({
  title?, description?, icon?,
  fields: [{ key, type: 'string' | 'boolean' | 'number' | 'enum' | 'secret', label, description?, placeholder?, default?, options?, min?, max?, step? }],
}): Disposer
ctx.config.get<T>(): T                         // 当前值（未保存过的字段取 default）
ctx.config.onChange<T>(fn: (next: T) => void): Disposer
```

宿主在插件详情页渲染表单并持久化。`enum` 需要 `options: [{ value, label }]`，`secret` 显示为密码框。

## 游戏库

```ts
ctx.games.list({ query?, limit?, offset?, status?, tags?, sort_by?, sort_order? }): Promise<{ games, total }>
ctx.games.get(id): Promise<Game>
ctx.games.findBySource(source, sourceId): Promise<Game | null>
ctx.games.create(input: GameCreateInput): Promise<Game>
ctx.games.update(id, patch: GamePatch): Promise<Game>
ctx.games.batchUpdate([{ id, patch }]): Promise<{ updated, failed? }>
ctx.games.delete(id) / batchDelete(ids)
ctx.games.setTags(id, names)                   // 只替换用户标签，不动刮削标签
ctx.games.refreshMetadata(id, { source?, fields? })
ctx.games.setCoverFromURL(id, url): Promise<string>
ctx.games.start(id, options?: LaunchOptions): Promise<boolean>
ctx.games.onChanged(fn): Disposer

ctx.games.tags.list(gameId) / add(gameId, name) / remove(tagId) / search(query) / gameIds(tagName)
ctx.games.sources.list(gameId) / upsert(gameId, source, sourceId) / setDefault(gameId, source) / remove(gameId, source)
ctx.games.sessions.list(gameId) / add(gameId, { start_time, duration }) / update(session) / remove(sessionId)
ctx.games.progress.get / list / save / clear
ctx.games.review.get(gameId) / save(review)

ctx.categories.list() / get(id) / listByGame(gameId) / games(categoryId)
ctx.categories.create({ name, emoji? }) / update(id, patch) / delete(id)
ctx.categories.addGames(categoryId, gameIds) / removeGames(categoryId, gameIds)
```

`Game` 的主要字段：`id`、`name`、`aliases`、`cover_url`、`company`、`summary`、`rating`（10 分制）、`release_date`、`path`、`status`、`source_type` / `source_id`（默认元数据来源）、`metadata_sources`、`is_nsfw`、`last_played_at`、`created_at`。只读字段在 `update` 时会被忽略，未知字段会报错。写入后游戏库与首页自动刷新。

## 元数据

```ts
ctx.metadata.registerSource({
  id,                                   // 宿主登记为 plugin:<插件 id>/<id>
  name: LocalizedString,
  icon?, link?: (sourceId) => url,
  normalizeId?: (input) => string | null,   // 接受用户粘贴的链接或编号
  rateLimit?: { perSecond },
  fetch(sourceId, { language, signal }): Promise<MetadataResult>,
  search(name, { language, limit, signal }): Promise<MetadataResult[]>,
  fetchBatch?(ids, opts): Promise<Record<string, MetadataResult>>,
}): Disposer

interface MetadataResult {
  game: Partial<Game>;   // search 的结果必须带 source_id；fetch / fetchBatch 不带时宿主用请求的 id 补上
  tags?: Array<{ name; source?; weight?; is_spoiler? }>;
}

ctx.metadata.search(name, opts?) / fetch(source, sourceId, opts?)   // 调用已有来源
ctx.metadata.getAuthToken(source)                                   // 宿主代管的 OAuth 令牌，目前支持 'hikarinagi'
```

## 下载与导入

```ts
ctx.downloads.requestInstall({
  name, downloadUrl, fileName?, archiveFormat?, startupPath?, installSubdir?, stripTopLevel?,
  headers?, archivePassword?, coverUrl?, source?, sourceId?, size?, silent?, metadata?,
})                                        // 宿主弹窗确认 → 下载解压 → 自动入库
ctx.downloads.list() / getImportStates(reqs) / onProgress(fn) / onImported(fn)
ctx.import.openModal(opts?)               // 打开导入向导
ctx.import.fromPath({ path, exePath?, name?, source?, sourceId?, metadata?, categoryIds? })
```

## 界面

```ts
ctx.ui.slot(name, def): Disposer          // 见 slots-and-events.md
ctx.ui.toast(msg, 'info' | 'success' | 'error' | 'loading')
ctx.ui.navigate(path, params?)
ctx.ui.openDrawer(id, props?) / closeDrawer()
ctx.ui.confirm({ title?, message?, confirmText?, cancelText?, danger? }): Promise<boolean>
ctx.ui.select({ title?, message?, options: [{ value, label, description?, icon? }], default? }): Promise<string | null>
```

`confirm` / `select` 是原生对话框；主窗口隐藏时会先显示主窗口，插件卸载时按取消处理。

## 窗口

```ts
const win = ctx.window.open(id, {
  title?, width, height, x?, y?,
  frameless?, transparent?, alwaysOnTop?, skipTaskbar?, resizable?,
  render: (props) => VNode,
});
win.setSize(w, h) / setPosition(x, y) / setAlwaysOnTop(v) / show() / hide() / close()
win.onMove(fn) / onFocus(fn) / onClose(fn)

ctx.window.main.show() / focus() / minimize() / isVisible()
```

无边框窗口里给可拖动的容器加 `dragWindow`；透明窗口用 `surface="glass"` 加 `radius` 画出可见区域。插件停用时它打开的窗口全部关闭。

## 主题

`ctx.theme.extend(tokens)`、`ctx.theme.registerFont({ family, file, target? })`、`ctx.theme.registerDecoration(def)`，见 [theme.md](theme.md)。

## 网络与 AI

```ts
fetch(url, init)                          // 全局 fetch：走宿主代理，默认带 LunaBox User-Agent；等待响应头最多 30 秒，流式响应体不限时
ctx.http.sse(url, { method?, headers?, body? }, { onEvent({ event, id, data }), onDone(), onError({ message }) }): Disposer
ctx.html.parse(html)                      // 类 jQuery：.select(css) .first() .eq(i) .length() .text() .attr(name) .html() .map(fn)

ctx.ai.getConfig(): { configured, provider, model }
ctx.ai.getCredentials(): { configured, provider, baseUrl, apiKey, model }   // 给插件自带的 agent 运行时用
ctx.ai.complete({ system?, messages, tools?, model?, maxTurns? }): Promise<{ content, toolCalls?, usage? }>
ctx.ai.stream(req, { onDelta(text), onToolCall(call) => result, onDone(usage?), onError(err) }): Disposer
```

`ctx.ai.complete` / `stream` 由宿主调用设置页配置的模型（OpenAI 兼容），`tools` 用 OpenAI function calling 格式。多轮对话界面直接用 `createAIChatStore`（见 [recipes.md](recipes.md)）。

## 系统

```ts
ctx.shell.openURL(url) / openPath(path)
ctx.audio.play(src, { volume? } | volume) / stop(src?)   // src 可为插件目录内的相对路径

ctx.fs.readFile(path): Promise<string> / writeFile(path, content) / exists(path)
ctx.fs.readDir(path): Promise<Array<{ name, is_dir }>> / mkdir(path) / remove(path)

ctx.process.platform                       // 'windows' | 'darwin' | 'linux'
ctx.process.exec(command, args?, opts?): Promise<{ code, stdout, stderr, timedOut, truncated }>
ctx.process.spawn(command, args?, opts?): { pid, onStdout, onStderr, onExit, write, closeStdin, kill }
// opts: cwd、env、timeout（exec 默认 60 秒）、input、shell（整行命令交给 cmd.exe 或 /bin/sh）、encoding（默认 auto，非 UTF-8 按系统代码页解码）
```

`ctx.process` 与主程序同权限、没有沙箱：非零退出码不会 reject，只有命令无法启动才 reject；插件卸载时会结束它 spawn 的整个进程树。执行前必须用 `ctx.ui.confirm` 把完整命令展示给用户。
