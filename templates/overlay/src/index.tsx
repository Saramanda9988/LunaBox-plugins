import type { Context, PluginWindowHandle } from 'lunabox';
import { Column, Icon, IconButton, Row, Text } from 'lunabox';
import { createStore, useStore, useTicker } from './store';

interface Settings {
  autoOpen?: boolean;
  autoClose?: boolean;
}

interface TimerState {
  gameName: string;
  startedAt: number | null; // 正在游玩时为开始时间
}

const WINDOW_SIZE = { width: 260, height: 60 };

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function apply(ctx: Context) {
  const t = (key: string, args?: Record<string, unknown>) => ctx.i18n.t(key, args);

  ctx.config.define({
    title: t('settings.title'),
    icon: 'timer-outline',
    fields: [
      { key: 'autoOpen', type: 'boolean', label: t('settings.autoOpen'), default: true },
      { key: 'autoClose', type: 'boolean', label: t('settings.autoClose'), default: true },
    ],
  });
  const settings = () => ctx.config.get<Settings>();

  const timer = createStore<TimerState>({ gameName: '', startedAt: null });
  let win: PluginWindowHandle | null = null;

  // 悬浮窗内容：整块可拖动（dragWindow），透明窗口里用 glass 表面画出圆角胶囊
  function TimerWindow() {
    const { gameName, startedAt } = useStore(timer);
    useTicker(1000);
    return (
      <Row
        width="full"
        height="full"
        surface="glass"
        radius="full"
        border
        paddingX="md"
        gap="sm"
        align="center"
        dragWindow
      >
        <Icon name="timer-outline" size={20} tone="accent" />
        <Column grow={1} minWidth={0}>
          <Text text={gameName || t('window.idle')} size="xs" tone="muted" maxLines={1} />
          <Text text={startedAt ? formatClock(Date.now() - startedAt) : '--:--:--'} weight="semibold" />
        </Column>
        <IconButton icon="close" label={t('window.close')} size="sm" onPress={closeWindow} />
      </Row>
    );
  }

  function openWindow() {
    if (win) {
      win.show();
      return;
    }
    win = ctx.window.open('timer', {
      title: t('window.title'),
      ...WINDOW_SIZE,
      frameless: true,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      render: TimerWindow,
    });
    // 用户或系统关闭窗口后清掉句柄，下次重新创建
    win.onClose(() => {
      win = null;
    });
  }

  function closeWindow() {
    const w = win;
    win = null;
    w?.close();
  }

  // 宿主事件：返回的 Disposer 会在插件停用时自动回收，插件打开的窗口也会一起关闭
  ctx.on('game/launched', ({ game }) => {
    timer.set({ gameName: game.name, startedAt: Date.now() });
    if (settings().autoOpen !== false) openWindow();
  });

  ctx.on('session/ended', ({ duration }) => {
    const { gameName } = timer.get();
    timer.set({ startedAt: null });
    ctx.ui.toast(t('toast.ended', { name: gameName, time: formatClock(duration * 1000) }), 'info');
    if (settings().autoClose !== false) closeWindow();
  });

  // 顶栏按钮：手动开关悬浮窗
  ctx.ui.slot('topbar.item', {
    id: 'toggle-timer',
    title: t('topbar.toggle'),
    icon: 'timer-outline',
    onPress: () => (win ? closeWindow() : openWindow()),
  });
}
