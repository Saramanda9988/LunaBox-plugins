import type { Context, Game } from 'lunabox';

// OpenAI function calling 格式的工具定义，交给 createAIChatStore 的 tools
export const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'search_games',
      description: 'Search the local game library by keyword. Returns id, name, developer, status and release date.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Keyword; empty lists recent games' },
          limit: { type: 'number', description: 'Max results, default 20' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_game',
      description: 'Get the details of one game in the local library by id, including summary and tags.',
      parameters: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
    },
  },
];

// 只把模型需要的字段交回去，避免把整条游戏记录塞进上下文
function brief(game: Game) {
  return {
    id: game.id,
    name: game.name,
    company: game.company,
    status: game.status,
    release_date: game.release_date,
    rating: game.rating,
  };
}

export async function runTool(ctx: Context, name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'search_games': {
      const limit = Math.min(50, Number(args.limit) || 20);
      const { games, total } = await ctx.games.list({ query: String(args.query ?? ''), limit });
      return { total, games: games.map(brief) };
    }
    case 'get_game': {
      const id = String(args.id ?? '');
      const [game, tags] = await Promise.all([ctx.games.get(id), ctx.games.tags.list(id)]);
      return { ...brief(game), summary: game.summary, tags: tags.map((tag) => tag.name) };
    }
    default:
      // 抛出的错误会作为工具结果交回模型，并在界面上标成失败
      throw new Error(`unknown tool: ${name}`);
  }
}
