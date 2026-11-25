import type { Context, Disposer } from 'lunabox';
import { defineThemePreset } from 'lunabox';
import { ACCENTS, accentPalette } from './palette';

interface Settings {
  accent?: string;
  radius?: number;
}

export function apply(ctx: Context) {
  const t = (key: string) => ctx.i18n.t(key);

  ctx.config.define({
    title: t('settings.title'),
    icon: 'palette-outline',
    fields: [
      {
        key: 'accent',
        type: 'enum',
        label: t('settings.accent'),
        default: 'teal',
        options: Object.keys(ACCENTS).map((value) => ({ value, label: t(`accent.${value}`) })),
      },
      {
        key: 'radius',
        type: 'number',
        label: t('settings.radius'),
        description: t('settings.radiusHint'),
        default: 8,
        min: 0,
        max: 16,
        step: 1,
      },
    ],
  });

  function buildTheme(settings: Settings) {
    const accent = ACCENTS[settings.accent ?? ''] ?? ACCENTS.teal;
    const radius = Math.min(16, Math.max(0, Number(settings.radius ?? 8)));
    // defineThemePreset 只做类型检查与补全，返回值原样交给 ctx.theme.extend
    return defineThemePreset({
      id: 'accent',
      light: accentPalette(accent.light),
      dark: accentPalette(accent.dark),
      shape: { control: radius, panel: radius },
    });
  }

  // 设置变化时先撤销旧主题再注册新主题；插件停用时宿主会回收最后一次注册
  let dispose: Disposer = ctx.theme.extend(buildTheme(ctx.config.get<Settings>()));
  ctx.config.onChange<Settings>((next) => {
    dispose();
    dispose = ctx.theme.extend(buildTheme(next));
  });
}
