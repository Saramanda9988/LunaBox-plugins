# 组件与设计令牌

组件都从 `'lunabox'` 导入。TSX 写法 `<Text text="…" />` 与函数写法 `Text({ text: '…' })` 等价；函数写法里列表项的 key 写成 `k`，子节点放在 `children`。精确的属性类型以 `node_modules/lunabox/src/types.ts` 里的 `*Props` 为准。

## 设计令牌

| 类型 | 可选值 | 实际值 |
| --- | --- | --- |
| `SpacingToken` | `'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| number` | 0 / 4 / 8 / 12 / 16 / 24 / 像素 |
| `RadiusToken` | `'sm' \| 'md' \| 'lg' \| 'full' \| number` | 6 / 10 / 14 / 999 / 像素 |
| `SurfaceToken` | `'glass' \| 'glass-card' \| 'panel' \| 'card' \| 'chip' \| 'subtle'` | 跟随明暗与玻璃模式的底色加描边 |
| `AlignToken` | `'start' \| 'center' \| 'end' \| 'stretch'` | 交叉轴对齐 |
| `JustifyToken` | `'start' \| 'center' \| 'end' \| 'between' \| 'space-between'` | 主轴分布 |
| `TextSizeToken` | `'xs' \| 'sm' \| 'base' \| 'lg' \| 'xl' \| '2xl' \| '3xl' \| '4xl' \| number` | 宿主字阶，`2xl` = 24/32、`3xl` = 30/38、`4xl` = 38/44 |
| `FontWeightToken` | `'normal' \| 'medium' \| 'semibold' \| 'bold'` | |
| `ToneToken` | `'default' \| 'muted' \| 'faint' \| 'strong' \| 'brand' \| 'accent' \| 'success' \| 'warning' \| 'danger' \| 'light' \| 'light-muted'` | 文字与图标语义色；`light` / `light-muted` 用在深色图片上 |

### 颜色（`ColorValue`）

```ts
type ColorValue =
  | ColorToken                                     // 语义令牌，见下
  | string                                         // '#rgb' '#rrggbb' '#rrggbbaa'，或 '<令牌|#hex>@<0..1>' 如 'black@0.42'
  | { light?: ColorValue; dark?: ColorValue }      // 明暗主题分别取值
  | { color?: ColorValue; token?: ColorValue; alpha?: number };
```

`ColorToken`：`transparent`、`white`、`black`；表面 `appBg`、`fadeBg`（玻璃模式下为 `appBg@0.88`，适合头图向页面底色融出）、`scrim`、`panelBg`、`panelBorder`、`cardBg`、`cardBorder`、`chipBg`、`divider`；文字 `text`、`textStrong`、`textMuted`、`textFaint`；语义 `primary`、`brand`、`accent`、`accentText`、`accentSoft`、`accentSoftText`、`success`、`warning`、`warning400`、`danger`、`brand700`、`brand800`、`brand900`。

`primary` / `brand` / `accent*` 跟随主题插件的强调色；`brand700` 等固定色阶不跟随。

渐变 `gradient: { angle?: number /* 180 = 自上而下 */, stops: [{ color, at? }, ...] }`；投影 `shadow: 'sm' | 'md' | 'lg' | { x, y, blur, spread, color }`。

## 通用布局属性（`LayoutProps`）

`Column`、`Row`、`Box`、`Stack` 都支持，`Image` 支持大部分：

| 分组 | 属性 |
| --- | --- |
| 间距 | `gap`、`padding`、`paddingX`、`paddingY`、`paddingTop/Right/Bottom/Left` |
| 外边距 | `margin`、`marginX`（可 `'auto'`）、`marginY`、`marginTop/Right/Bottom/Left`、`centerX: true` |
| 尺寸 | `width` / `height`（像素或 `'full'`）、`minWidth`、`maxWidth`、`minHeight`、`maxHeight` |
| 弹性 | `grow`、`shrink`、`basis`、`wrap` |
| 对齐 | `align`、`alignSelf`、`justify` |
| 定位 | `position: 'absolute'`、`inset`、`top`、`right`、`bottom`、`left`、`zIndex`（配合 `Stack`） |
| 外观 | `surface`、`background`、`hoverBackground`、`gradient`、`border`、`borderColor`、`borderBottom`、`borderLeft`、`radius`、`clip`、`shadow`、`opacity` |
| 交互 | `onPress`、`onContextMenu`、`disabled`、`dragWindow`（拖动窗口）、`pointerEvents: 'none'`、`label`（无障碍名） |

文字在弹性容器里需要截断或换行时，给外层 `Column` 加 `grow={1} minWidth={0}`，文字用 `maxLines` 或 `wrap`。

## 32 个原语

### 布局

| 组件 | 要点 |
| --- | --- |
| `Column` / `Row` | 纵向 / 横向 Flex；`Row wrap` 自动换行 |
| `Box` | 通用容器；`springPress`（原生弹簧按压动画）、`squishX`、`squishY`、`flipX`、`onPressIn`、`onPressOut` |
| `Stack` | 层叠容器，子节点用 `position: 'absolute'` + 偏移 + `zIndex` 叠放 |
| `ScrollArea` | `padding`、`gap`、`height`、`grow`、`autoScrollBottom`（聊天）、`onReachBottom`（分页） |
| `Grid` | `cols` 或 `minColWidth` 自适应列数、`gap` |
| `Divider` | `subtle`、`marginY` |
| `Spacer` | 撑开剩余空间 |

### 文本

| 组件 | 要点 |
| --- | --- |
| `Text` | `text`、`size`、`lineHeight`、`weight`、`tone`、`color`、`wrap`、`maxLines`、`selectable` |
| `Markdown` | `content`、`streaming`（AI 流式回复）、`onLinkPress(href)`；支持表格、任务列表、代码高亮 |
| `CodeBlock` | `code`、`language`、`copyable` |

### 表单

| 组件 | 要点 |
| --- | --- |
| `Button` | `label`、`icon`、`variant: 'secondary' \| 'primary' \| 'danger' \| 'ghost'`、`size: 'sm' \| 'md' \| 'lg'`、`disabled`、`loading`、`onPress` |
| `IconButton` | `icon`、`label`（提示文字）、`size: 'sm' \| 'md'`、`active`、`disabled`、`onPress` |
| `Input` | `value`、`placeholder`、`password`、`disabled`、`onChange(v)`（150 ms 防抖）、`onSubmit(v)` |
| `Textarea` | `value`、`placeholder`、`rows`、`autoResize`、`onChange`、`onSubmit`（Ctrl/Cmd+Enter） |
| `Switch` / `Checkbox` | `checked`、`label`（Checkbox）、`disabled`、`onChange(checked)` |
| `Select` | `value`、`options: [{ value, label }]`、`placeholder`、`onChange(v)` |
| `NumberInput` | `value`、`min`、`max`、`step`、`onChange(v)` |
| `Tabs` | `value`、`items: [{ key, label, badge? }]`、`onChange(key)` |

输入控件是受控的：`value` 来自 `useState`，`onChange` 里 `setState`。

### 展示与反馈

| 组件 | 要点 |
| --- | --- |
| `Image` | `src`（本地路径或 http(s)，支持远程 svg）、`fallbackSrc`、`aspectRatio`、`fit: 'cover' \| 'contain'`、`blur`、`previewable`（点击看大图）、`transparent`、`hoverBorder`、`hideWhenEmpty`、`onPress`、`onLoad({ width, height })`、`onError`；只设 `maxWidth` / `maxHeight` 时按原图比例缩放 |
| `Avatar` | `src`、`fallback`、`size` |
| `Icon` | `name`（MDI 图标名，不带 `mdi-` 前缀，如 `timer-outline`）、`size`、`tone`、`color`、`fallback` |
| `Badge` | `label`、`tone: 'default' \| 'brand' \| 'success' \| 'warning' \| 'danger'`、`icon`、`closable`、`onPress`、`onClose` |
| `Card` | `title`、`cover`、`padding`、`width`、`height`、`hoverable`、`onPress` |
| `Collapsible` | `title`、`icon`、`defaultOpen`、`status: 'running' \| 'done' \| 'error'`（适合工具调用） |
| `Progress` | `value`（0..1 或 0..100）、`label`、`indeterminate`、`tone` |
| `Empty` | `icon`、`title`、`description` |
| `Skeleton` | `lines`、`height`（加载占位） |
| `Tooltip` | `content`，包裹一个子节点 |
| `Table` | `columns`、`rows`、`onRowPress({ index, row })` |

### `NativeSlot`：嵌入宿主原生区域

在游戏详情页插槽（`game.detail.hero` / `header` / `tab` / `aside`）里可用：

| `name` | 内容 | 可传参数 |
| --- | --- | --- |
| `back` | 返回按钮 | |
| `cover` | 封面（含 NSFW 模糊与大图查看） | `width` |
| `toolbar` | 启动按钮与操作菜单 | `maxWidth` |
| `tags` | 标签编辑与展示 | |
| `summary` | 游戏简介 | |

## `HeroBanner`：详情页头图模板

由原语组合而成，用于 `game.detail.hero`：全宽头图、明暗自适应的渐变遮罩、透明徽标、元信息、五星评分、封面与启动栏。

```tsx
<HeroBanner
  banner={screenshotUrl}
  logo={logoUrl}
  title={game.name}
  subtitle={altTitle}
  meta={[{ icon: 'calendar', text: '2015-10-23' }, '枕']}
  rating={{ score: 9.3, total: 420 }}   // 10 分制
  backSlot="back"
  coverSlot="cover"
  toolbarSlot="toolbar"
  safeTop={props.safeTop}
  pager={{ current: 1, total: 5 }}
  onPrev={prev}
  onNext={next}
/>
```

其他属性：`height`（默认 560）、`contentMaxWidth`（默认 1200）、`coverWidth`、`toolbarMaxWidth`、`fallbackBanner`、`blur`、`label`。
