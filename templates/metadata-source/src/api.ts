import type { MetadataResult } from 'lunabox';

// 示例对接 VNDB Kana API（https://api.vndb.org/kana），换成你的站点时只需改这个文件。

export interface ApiOptions {
  baseUrl: string;
  token?: string;
  signal?: AbortSignal;
}

interface VN {
  id: string;
  title: string;
  alttitle?: string | null;
  released?: string | null;
  rating?: number | null;
  description?: string | null;
  image?: { url: string; sexual?: number } | null;
  developers?: Array<{ name: string }>;
  tags?: Array<{ name: string; rating: number; spoiler: number }>;
}

const FIELDS =
  'id, title, alttitle, released, rating, description, image.url, image.sexual, developers.name, tags.name, tags.rating, tags.spoiler';

async function queryVN(filters: unknown[], results: number, opts: ApiOptions): Promise<VN[]> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers.Authorization = `Token ${opts.token}`;
  // 全局 fetch 走宿主代理设置并带上 LunaBox 的 User-Agent
  const resp = await fetch(`${opts.baseUrl.replace(/\/$/, '')}/vn`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ filters, fields: FIELDS, results }),
    signal: opts.signal,
  });
  if (!resp.ok) throw new Error(`VNDB HTTP ${resp.status}`);
  const data = (await resp.json()) as { results?: VN[] };
  return data.results ?? [];
}

// 把站点数据映射成 LunaBox 的 MetadataResult：game 里是要写入游戏的字段，tags 是刮削标签
function toResult(vn: VN): MetadataResult {
  return {
    game: {
      name: vn.alttitle || vn.title,
      aliases: vn.alttitle ? [vn.title] : [],
      source_id: vn.id,
      company: vn.developers?.[0]?.name ?? '',
      summary: vn.description ?? '',
      rating: vn.rating ? Number((vn.rating / 10).toFixed(1)) : 0, // VNDB 是 100 分制，LunaBox 统一 10 分制
      release_date: vn.released ?? '',
      cover_url: vn.image?.url ?? '',
      is_nsfw: (vn.image?.sexual ?? 0) >= 1.5,
    },
    tags: (vn.tags ?? [])
      .filter((tag) => tag.rating >= 2)
      .slice(0, 20)
      .map((tag) => ({ name: tag.name, weight: tag.rating, is_spoiler: tag.spoiler > 0 })),
  };
}

export async function fetchById(id: string, opts: ApiOptions): Promise<MetadataResult> {
  const [vn] = await queryVN(['id', '=', id], 1, opts);
  if (!vn) throw new Error(`not found: ${id}`);
  return toResult(vn);
}

export async function search(name: string, limit: number, opts: ApiOptions): Promise<MetadataResult[]> {
  return (await queryVN(['search', '=', name], limit, opts)).map(toResult);
}

// 接受 "v17"、"17" 或条目链接，统一成 "v17"；无法识别时返回 null
export function normalizeId(input: string): string | null {
  const m = /(?:^|\/)v?(\d+)\/?$/i.exec(input.trim());
  return m ? `v${m[1]}` : null;
}
