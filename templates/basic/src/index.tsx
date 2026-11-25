import type { Context } from 'lunabox';
import { Button, Column, Row, Text, useEffect, useState } from 'lunabox';

interface Settings {
  greeting?: string;
  step?: number;
}

// 入口：宿主加载插件时调用 apply(ctx)。这里注册的插槽、监听与设置会在插件停用或重载时自动回收。
export function apply(ctx: Context) {
  // 界面文字放在 locales/<语言>.json，跟随 LunaBox 的界面语言
  const t = (key: string, args?: Record<string, unknown>) => ctx.i18n.t(key, args);

  // 声明式设置：宿主在插件详情页渲染表单并持久化，用 ctx.config.get() 读取
  ctx.config.define({
    title: t('settings.title'),
    fields: [
      { key: 'greeting', type: 'string', label: t('settings.greeting'), default: t('settings.greetingDefault') },
      { key: 'step', type: 'number', label: t('settings.step'), default: 1, min: 1, max: 10, step: 1 },
    ],
  });

  function HomePage() {
    const [settings, setSettings] = useState(() => ctx.config.get<Settings>());
    // ctx.storage 是插件私有的键值存储，重启后保留
    const [count, setCount] = useState(() => ctx.storage.get<number>('count') ?? 0);

    // 设置变更时刷新页面；onChange 返回的 Disposer 正好作为 effect 的清理函数
    useEffect(() => ctx.config.onChange<Settings>((next) => setSettings(next)), []);

    const step = Number(settings.step) || 1;
    const update = (next: number) => {
      ctx.storage.set('count', next);
      setCount(next);
    };

    return (
      <Column padding="lg" gap="md" maxWidth={720}>
        <Text text={settings.greeting || t('settings.greetingDefault')} size="2xl" weight="bold" />
        <Text text={t('home.description')} tone="muted" wrap />
        <Row gap="sm" align="center">
          <Button label={`-${step}`} onPress={() => update(count - step)} />
          <Text text={t('home.count', { count })} size="lg" weight="semibold" />
          <Button label={`+${step}`} variant="primary" onPress={() => update(count + step)} />
        </Row>
        <Row>
          <Button
            label={t('home.toast')}
            icon="bell-outline"
            variant="ghost"
            onPress={() => ctx.ui.toast(t('home.toastMessage', { count }), 'success')}
          />
        </Row>
      </Column>
    );
  }

  ctx.ui.slot('sidebar.page', {
    id: 'home',
    title: t('page.title'),
    icon: 'puzzle-outline',
    render: HomePage,
  });

  ctx.logger.info('plugin loaded');
}
