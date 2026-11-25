# 主题、字体与装饰

## `ctx.theme.extend(tokens): Disposer`

```ts
import { defineThemePreset } from 'lunabox';   // 只做类型检查与补全，原样返回

ctx.theme.extend(defineThemePreset({
  id: 'my-theme',
  light: { primaryBtn: '#0d9488', accent: '#0d9488', /* … */ },
  dark:  { primaryBtn: '#2dd4bf', accent: '#2dd4bf', /* … */ },
  shape: { control: 8, panel: 8 },
  brand: { wordmark: 'assets/wordmark.svg', hideIcon: true },
  material: { sidebar: 'acrylic', tint: '#ffffffe0', tintDark: '#000000e0' },
  glass: { enabled: false },
}));
```

- 只写需要覆盖的令牌，没写的保持宿主原配色。`light` 和 `dark` 分别生效，两边都要给。
- 颜色用 `#rrggbb` 或带透明度的 `#rrggbbaa`。
- 设置变化时先调用上一次 `extend` 返回的 `Disposer`，再用新值重新 `extend`。插件停用时宿主自动撤销。
- 多个插件同时声明 `glass`、`brand`、`material` 时以后注册的为准。

### 色板令牌（`ThemePaletteTokens`，78 个）

| 区域 | 令牌 |
| --- | --- |
| 文字 | `text`、`textStrong`、`textMuted`、`textFaint` |
| 窗口骨架 | `appBg`、`topbarBg`、`topbarBorder`、`controlIcon`、`controlHover` |
| 侧边栏 | `sidebarBg`、`sidebarBorder`、`navText`、`navHover`、`navActiveBg`、`navActive` |
| 输入框（含文本域、数字输入、下拉选择、编辑页字段） | `inputBg`、`inputBorder`、`inputFocus`、`inputIcon`、`placeholder` |
| 次要按钮 | `toolBtnBg`、`toolBtnBorder`、`toolBtnHover`、`toolBtnIcon`、`toolBtnText`、`toolBtnActiveBg`、`toolBtnActiveBorder`、`toolBtnActiveText` |
| 主按钮（含开关打开态、启动按钮、弹窗确认） | `primaryBtn`、`primaryBtnHover`、`primaryBtnText` |
| 强调色（选中、当前状态、加载指示、链接） | `accent`、`accentText`、`accentSoft`、`accentSoftText` |
| 详情页标签栏 | `tabText`、`tabHover`、`tabActive`、`tabIndicator` |
| 详情页工具栏图标按钮 | `actionBtnBg`、`actionBtnHover`、`actionBtnIcon`、`actionBtnIconHover`、`actionBtnRing`、`actionBtnRingOffset` |
| 卡片与封面 | `cardBg`、`cardBorder`、`cardBorderHover`、`coverBg` |
| 滚动条 | `scrollThumb`、`scrollThumbHover` |
| 面板与分隔 | `panelBg`、`panelBorder`、`divider`、`sectionLabel` |
| 菜单与下拉列表 | `menuHover`、`menuText`、`menuSelected`、`menuCheck` |
| 筛选标签 | `chipBg`、`chipText`、`chipHover`、`chipActiveBg`、`chipActiveText`、`chipRing` |
| 下拉选择框 | `selectBg`、`selectBorder`、`selectText` |
| 列表与表格 | `listFocus`、`listSelected` |
| 开关 | `switchOff`、`switchThumb` |
| 提示气泡 | `tooltipBg`、`tooltipText`、`tooltipBorder` |
| 危险按钮 | `dangerBtn`、`dangerBtnHover`、`dangerBtnText` |

每个令牌的说明见 `node_modules/lunabox/src/types.ts` 里 `ThemePaletteTokens` 的注释。宿主的成功 / 警告 / 错误状态色、封面上的玻璃按钮和阴影不受色板影响。

插件自己界面里的 `primary`、`brand`、`accent*` 颜色令牌、`tone="brand" | "accent"`、`Badge tone="brand"`、`Tabs` 下划线、`Progress` 和 Markdown 链接都跟随这里的强调色，所以其他插件用这些令牌就能适配你的主题。

### 其他字段

| 字段 | 作用 |
| --- | --- |
| `shape: { control?, panel? }` | 全局圆角（像素）。`control`：按钮、图标按钮、输入框、下拉、分段切换、侧边栏导航项、菜单项、详情页工具栏；`panel`：下拉菜单、弹出层、提示气泡、日期选择、筛选抽屉、数据表格等。卡片、封面、标签胶囊、头像不受影响 |
| `brand: { wordmark?, wordmarkDark?, icon?, iconDark?, hideWordmark?, hideIcon? }` | 替换侧边栏与顶栏的 LunaBox 字标和图标（插件目录内的 svg / png / webp）；`*Dark` 是深色模式专用图 |
| `material: { sidebar?: 'acrylic' \| 'mica', tint?, tintDark? }` | 侧边栏使用系统半透明材质（Windows 11 22H2+ 的 Acrylic / Mica，macOS 用系统侧边栏材质），上面叠 `tint`。Linux、旧版 Windows 和开启自定义背景时不生效；Windows 上第一次启用需要重启应用。此时 `navHover`、`navActiveBg`、`sidebarBorder` 宜用半透明色 |
| `glass: { enabled?, opacity?, blur?, backgroundImage? }` | `enabled: false` 锁定配色：插件启用期间不使用用户的自定义背景与玻璃模式；`true` 开启玻璃模式，可用 `backgroundImage` 提供插件自带的背景 |

## `ctx.theme.registerFont({ family, file, target? }): Disposer`

`file` 是插件目录内的字体文件，`target: 'ui'`（默认）替换界面字体，`'mono'` 替换等宽字体。

## `ctx.theme.registerDecoration(def): Disposer`

在应用窗口上叠一层装饰（角色立绘、水印、桌宠）。也可以用 `ctx.ui.slot('app.decoration', def)` 注册，参数相同。

```ts
interface DecorationOptions {
  id: string;
  layer?: 'background' | 'foreground';   // 内容下方 / 上方
  anchor?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'center';
  offset?: { x: number; y: number };
  size?: { width: number; height: number };
  opacity?: number;
  pointerEvents?: 'none' | 'auto';       // 默认点击穿透到下面的界面；需要交互时设 'auto'
  routes?: string[];                     // 只在这些页面显示
  image?: string;                        // 静态图片
  render?: (props: { route: string; dark: boolean }) => VNode;   // 或自定义渲染
}
```

可交互的桌宠用 `render` 返回 `Box springPress onPressIn onPressOut`，配合 `ctx.audio.play('assets/press.mp3')`。
