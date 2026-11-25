import type { Context } from 'lunabox';
import { fetchById, normalizeId, search, type ApiOptions } from './api';

interface Settings {
  baseUrl?: string;
  token?: string;
}

const DEFAULT_BASE_URL = 'https://api.vndb.org/kana';

export function apply(ctx: Context) {
  const t = (key: string) => ctx.i18n.t(key);

  ctx.config.define({
    title: t('settings.title'),
    icon: 'database-search-outline',
    fields: [
      { key: 'baseUrl', type: 'string', label: t('settings.baseUrl'), default: DEFAULT_BASE_URL },
      // secret 类型在设置页以密码框显示
      { key: 'token', type: 'secret', label: t('settings.token'), description: t('settings.tokenHint'), default: '' },
    ],
  });

  const apiOptions = (signal?: AbortSignal): ApiOptions => {
    const cfg = ctx.config.get<Settings>();
    return { baseUrl: cfg.baseUrl || DEFAULT_BASE_URL, token: cfg.token || undefined, signal };
  };

  // 宿主按 plugin:<插件 id>/<来源 id> 登记，不会和内置来源或其他插件重名。
  // 这个完整 id 会写进游戏的元数据来源，发布后不要再改插件 id 和来源 id。
  ctx.metadata.registerSource({
    id: 'vndb',
    name: { 'zh-CN': '示例来源（VNDB）', 'en-US': 'Example source (VNDB)' },
    icon: 'database-search-outline',
    link: (sourceId) => `https://vndb.org/${sourceId}`,
    normalizeId,
    rateLimit: { perSecond: 2 },
    fetch: (sourceId, { signal }) => fetchById(sourceId, apiOptions(signal)),
    search: (name, { limit, signal }) => search(name, limit, apiOptions(signal)),
  });
}
