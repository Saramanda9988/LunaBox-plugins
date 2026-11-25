# 常用写法

## 插件级共享状态

事件回调、定时器、多个界面（页面、抽屉、悬浮窗）共用的状态放在 `apply` 里的 store，组件订阅后重渲染：

```ts
function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => state,
    set(patch: Partial<T>) {
      state = { ...state, ...patch };
      listeners.forEach((fn) => fn());
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => { listeners.delete(fn); };
    },
  };
}

function useStore<T extends object>(store: ReturnType<typeof createStore<T>>): T {
  const [, setVersion] = useState(0);
  useEffect(() => store.subscribe(() => setVersion((v) => v + 1)), []);
  return store.get();
}
```

## 设置变化后重新注册

```ts
let dispose = ctx.theme.extend(build(ctx.config.get()));
ctx.config.onChange((next) => {
  dispose();
  dispose = ctx.theme.extend(build(next));
});
```

组件里跟随设置刷新：

```tsx
const [settings, setSettings] = useState(() => ctx.config.get<Settings>());
useEffect(() => ctx.config.onChange<Settings>(setSettings), []);
```

## 异步加载数据

```tsx
function Panel({ gameId }: { gameId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let alive = true;                       // 切换游戏或卸载后丢弃过期结果
    setData(null);
    load(gameId).then(
      (d) => alive && setData(d),
      (e) => alive && setError(String(e)),
    );
    return () => { alive = false; };
  }, [gameId]);

  if (error) return <Empty icon="alert-circle-outline" title={error} />;
  if (!data) return <Skeleton lines={3} />;
  return <Text text={data.title} />;
}
```

## SQLite 缓存远程接口

```ts
const ready = ctx.db.exec(`CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY, payload TEXT NOT NULL, fetched_at INTEGER NOT NULL)`);

async function cached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  await ready;
  const row = await ctx.db.queryOne<{ payload: string; fetched_at: number }>(
    'SELECT payload, fetched_at FROM cache WHERE key = ?', [key]);
  if (row && Date.now() - row.fetched_at < ttlMs) return JSON.parse(row.payload);
  try {
    const value = await fetcher();
    await ctx.db.exec(
      `INSERT INTO cache (key, payload, fetched_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`,
      [key, JSON.stringify(value), Date.now()]);
    return value;
  } catch (err) {
    if (row) return JSON.parse(row.payload);  // 离线时用过期缓存
    throw err;
  }
}
```

## 分页列表

```tsx
import { createPagination, Grid, ScrollArea, Card, Button } from 'lunabox';

const usePage = createPagination(async ({ page, pageSize, query }) => {
  const res = await fetch(`${API}/list?q=${encodeURIComponent(query)}&page=${page}&size=${pageSize}`);
  const body = await res.json();
  return { items: body.items, hasMore: body.items.length === pageSize };
}, { pageSize: 24 });

function ListPage() {
  const [query, setQuery] = useState('');
  const { items, loading, hasMore, error, loadMore, refresh } = usePage(query);
  return (
    <Column height="full" gap="md" padding="lg">
      <Input value={query} placeholder="搜索" onSubmit={setQuery} />
      <ScrollArea grow={1} onReachBottom={() => hasMore && !loading && loadMore()}>
        <Grid minColWidth={180} gap="md">
          {items.map((it) => <Card key={it.id} title={it.title} cover={it.cover} hoverable />)}
        </Grid>
      </ScrollArea>
    </Column>
  );
}
```

`queryKey`（这里是 `query`）变化时分页自动从第一页重新加载。

## 抓取网页

```ts
const html = await (await fetch(url)).text();
const $ = ctx.html.parse(html);
const title = $.select('h1').first().text();
const links = $.select('a.item').map((a) => ({ text: a.text(), href: a.attr('href') ?? '' }));
```

## 写操作前确认

```ts
const ok = await ctx.ui.confirm({
  title: '删除 3 款游戏？',
  message: '只删除库里的记录，不会删除游戏文件。',
  confirmText: '删除',
  danger: true,
});
if (!ok) return;
await ctx.games.batchDelete(ids);
```

## AI 对话（宿主模型）

```tsx
const chat = createAIChatStore(ctx, {
  system: '你是 LunaBox 游戏库助手……',
  tools: [{
    type: 'function',
    function: {
      name: 'search_games',
      description: '按关键字搜索本地游戏库',
      parameters: { type: 'object', properties: { query: { type: 'string' } } },
    },
  }],
  onToolCall: async ({ name, arguments: args }) => {
    if (name === 'search_games') return ctx.games.list({ query: String(args.query ?? ''), limit: 20 });
    throw new Error(`unknown tool: ${name}`);  // 错误会作为工具结果交回模型
  },
  onError: (err) => ctx.ui.toast(err.message, 'error'),
});

function ChatPanel() {
  const [, setVersion] = useState(0);
  useEffect(() => chat.subscribe(() => setVersion((v) => v + 1)), []);
  const { messages, streaming } = chat.getState();
  // messages: [{ role: 'user' | 'assistant', content, toolCalls?: [{ id, name, status, result }] }]
  // 发送 chat.send(text)，停止 chat.abort()，清空 chat.clear()
  // 回复用 <Markdown content={m.content} streaming={streaming && isLast} />，工具调用用 <Collapsible status={tc.status}>
}
```

`ctx.ai.getConfig().configured` 为 false 时提示用户先在「设置 → AI」配置模型。工具结果只返回模型需要的字段，避免把整条记录塞进上下文。

## 自带 agent 运行时

需要多轮自主调用工具、Anthropic 端点或更细的控制时，打包 [pi](https://github.com/earendil-works/pi)（`@earendil-works/pi-ai` + `@earendil-works/pi-agent-core`），不需要任何补丁就能在插件里运行：

```ts
const cred = ctx.ai.getCredentials();   // { configured, provider, baseUrl, apiKey, model }
// 用 cred 创建 provider 与 Agent；工具实现里调用 ctx.games.*、fetch + ctx.html.parse、ctx.process（先 ctx.ui.confirm）
```

pi 自带的 bash / read / edit 工具依赖 Node，在插件里用 `ctx.process` / `ctx.fs` 实现同名工具。两个 provider 一起打包约 2 MB，`lunabox-plugin build --minify` 后约 770 KB。

## 启动拦截

```ts
// 用户在插件里勾选过“需要转区”的游戏，启动时自动开启 Locale Emulator
ctx.on('launch/prepare', ({ game }) => {
  const games = ctx.storage.get<string[]>('locale-emulator-games') ?? [];
  if (games.includes(game.id)) return { options: { use_locale_emulator: true } };
});
```

`game` 里没有标签，需要按标签判断时用 `await ctx.games.tags.list(game.id)`。拦截器默认 3 秒超时；要等用户操作时注册时传 `{ timeout }`（最多 10 分钟）。
