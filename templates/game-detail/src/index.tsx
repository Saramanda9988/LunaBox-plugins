import type { Context, Game } from 'lunabox';
import { Button, Column, Empty, Row, Skeleton, Text, Textarea, useEffect, useState } from 'lunabox';
import { createNotesDB } from './db';

// game.detail.* 插槽的 render 会收到当前游戏
interface DetailProps {
  game: Game;
  gameId: string;
}

export function apply(ctx: Context) {
  const t = (key: string, args?: Record<string, unknown>) => ctx.i18n.t(key, args);
  const notes = createNotesDB(ctx);

  // 笔记被别处（如右键菜单）清空时，通知已打开的标签页重新读取
  const changed = new Set<(gameId: string) => void>();
  const notifyChanged = (gameId: string) => changed.forEach((fn) => fn(gameId));

  function NotesTab({ gameId }: DetailProps) {
    const [loading, setLoading] = useState(true);
    const [draft, setDraft] = useState('');
    const [savedAt, setSavedAt] = useState(0);
    const [saving, setSaving] = useState(false);
    const [version, setVersion] = useState(0);

    useEffect(() => {
      const fn = (id: string) => id === gameId && setVersion((v) => v + 1);
      changed.add(fn);
      return () => changed.delete(fn);
    }, [gameId]);

    useEffect(() => {
      let alive = true;
      setLoading(true);
      notes.get(gameId).then((note) => {
        if (!alive) return;
        setDraft(note?.content ?? '');
        setSavedAt(note?.updated_at ?? 0);
        setLoading(false);
      });
      return () => {
        alive = false;
      };
    }, [gameId, version]);

    const save = async () => {
      setSaving(true);
      try {
        setSavedAt(await notes.save(gameId, draft));
        ctx.ui.toast(t('notes.saved'), 'success');
      } catch (err) {
        ctx.logger.error('save note failed', err);
        ctx.ui.toast(t('notes.saveFailed'), 'error');
      } finally {
        setSaving(false);
      }
    };

    if (loading) return <Skeleton lines={4} />;

    return (
      <Column gap="md" paddingY="md">
        <Textarea value={draft} rows={8} autoResize placeholder={t('notes.placeholder')} onChange={setDraft} onSubmit={save} />
        <Row gap="sm" align="center" justify="between">
          <Text
            text={savedAt ? t('notes.updatedAt', { time: new Date(savedAt).toLocaleString() }) : t('notes.never')}
            size="sm"
            tone="muted"
          />
          <Button label={t('notes.save')} icon="content-save-outline" variant="primary" loading={saving} onPress={save} />
        </Row>
      </Column>
    );
  }

  function InfoAside({ game }: DetailProps) {
    const rows = [
      { label: t('aside.company'), value: game.company },
      { label: t('aside.releaseDate'), value: game.release_date },
      { label: t('aside.rating'), value: game.rating ? game.rating.toFixed(1) : '' },
      { label: t('aside.lastPlayed'), value: game.last_played_at ? new Date(game.last_played_at).toLocaleDateString() : '' },
    ].filter((row) => row.value);

    return (
      <Column surface="card" radius="md" padding="md" gap="sm">
        <Text text={t('aside.title')} weight="semibold" />
        {rows.length === 0 ? (
          <Empty icon="information-outline" title={t('aside.empty')} />
        ) : (
          rows.map((row) => (
            <Row key={row.label} gap="md" justify="between">
              <Text text={row.label} size="sm" tone="muted" />
              <Text text={String(row.value)} size="sm" selectable />
            </Row>
          ))
        )}
      </Column>
    );
  }

  ctx.ui.slot('game.detail.tab', {
    id: 'notes',
    title: t('notes.title'),
    icon: 'notebook-outline',
    render: NotesTab,
  });

  ctx.ui.slot('game.detail.aside', {
    id: 'info',
    render: InfoAside,
  });

  // 游戏卡片右键与详情页「更多」菜单里的动作
  ctx.ui.slot('game.actions', {
    id: 'clear-notes',
    title: t('actions.clear'),
    icon: 'notebook-remove-outline',
    async run(game) {
      if (!(await notes.get(game.id))) {
        ctx.ui.toast(t('actions.nothing'), 'info');
        return;
      }
      const ok = await ctx.ui.confirm({
        title: t('actions.confirmTitle'),
        message: t('actions.confirmMessage', { name: game.name }),
        danger: true,
      });
      if (!ok) return;
      await notes.remove(game.id);
      notifyChanged(game.id);
      ctx.ui.toast(t('actions.cleared'), 'success');
    },
  });
}
