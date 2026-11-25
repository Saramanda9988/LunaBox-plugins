import type { Context } from 'lunabox';

export interface Note {
  game_id: string;
  content: string;
  updated_at: number;
}

// ctx.db 是插件独立的 SQLite（plugins-data/<id>/plugin.db），第一次调用时才创建文件
export function createNotesDB(ctx: Context) {
  const ready = ctx.db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      game_id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  return {
    async get(gameId: string): Promise<Note | null> {
      await ready;
      return ctx.db.queryOne<Note>('SELECT game_id, content, updated_at FROM notes WHERE game_id = ?', [gameId]);
    },
    async save(gameId: string, content: string): Promise<number> {
      await ready;
      const now = Date.now();
      await ctx.db.exec(
        `INSERT INTO notes (game_id, content, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(game_id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
        [gameId, content, now],
      );
      return now;
    },
    async remove(gameId: string): Promise<void> {
      await ready;
      await ctx.db.exec('DELETE FROM notes WHERE game_id = ?', [gameId]);
    },
  };
}

export type NotesDB = ReturnType<typeof createNotesDB>;
