import type { Context, Game } from 'lunabox';
import {
  Badge,
  Button,
  Collapsible,
  Column,
  Empty,
  IconButton,
  Markdown,
  Row,
  ScrollArea,
  Text,
  Textarea,
  createAIChatStore,
  useEffect,
  useState,
} from 'lunabox';
import { TOOLS, runTool } from './tools';

export function apply(ctx: Context) {
  const t = (key: string, args?: Record<string, unknown>) => ctx.i18n.t(key, args);

  // 多轮对话、流式拼接与工具调用状态都由 store 管理；模型调用走宿主设置页配置的 AI
  const chat = createAIChatStore(ctx, {
    system: t('prompt.system'),
    tools: TOOLS,
    onToolCall: (call) => runTool(ctx, call.name, call.arguments),
    onError: (err) => ctx.ui.toast(err.message, 'error'),
  });

  function ChatPanel() {
    const [, setVersion] = useState(0);
    const [input, setInput] = useState('');
    useEffect(() => chat.subscribe(() => setVersion((v) => v + 1)), []);

    const { messages, streaming } = chat.getState();
    const ai = ctx.ai.getConfig();

    const send = () => {
      const text = input.trim();
      if (!text || streaming) return;
      setInput('');
      chat.send(text);
    };

    return (
      <Column height="full" gap="sm" padding="md">
        <Row justify="between" align="center">
          <Row gap="sm" align="center">
            <Text text={t('panel.title')} weight="semibold" />
            <Badge
              label={ai.configured ? ai.model || t('panel.configured') : t('panel.notConfigured')}
              tone={ai.configured ? 'success' : 'warning'}
            />
          </Row>
          <IconButton icon="broom" label={t('panel.clear')} size="sm" disabled={messages.length === 0} onPress={() => chat.clear()} />
        </Row>

        <ScrollArea grow={1} gap="md" autoScrollBottom>
          {messages.length === 0 ? (
            <Empty
              icon="robot-happy-outline"
              title={t('panel.emptyTitle')}
              description={ai.configured ? t('panel.emptyHint') : t('panel.configureHint')}
            />
          ) : (
            messages.map((m, i) => (
              <Column key={`m${i}`} gap="xs">
                <Text text={m.role === 'user' ? t('panel.you') : t('panel.assistant')} size="xs" weight="semibold" tone="muted" />
                {(m.toolCalls ?? []).map((tc) => (
                  <Collapsible key={tc.id} title={t('panel.toolCall', { name: tc.name })} icon="wrench-outline" status={tc.status as 'running' | 'done' | 'error'}>
                    <Text text={tc.result ?? '…'} size="xs" tone="muted" selectable />
                  </Collapsible>
                ))}
                {m.role === 'user' ? (
                  <Text text={m.content} wrap selectable />
                ) : (
                  <Markdown content={m.content} streaming={streaming && i === messages.length - 1} />
                )}
              </Column>
            ))
          )}
        </ScrollArea>

        <Row gap="sm" align="end">
          <Column grow={1}>
            <Textarea value={input} rows={2} autoResize placeholder={t('panel.placeholder')} onChange={setInput} onSubmit={send} />
          </Column>
          {streaming ? (
            <Button label={t('panel.stop')} variant="danger" onPress={() => chat.abort()} />
          ) : (
            <Button label={t('panel.send')} variant="primary" disabled={!ai.configured} onPress={send} />
          )}
        </Row>
      </Column>
    );
  }

  ctx.ui.slot('workspace.drawer', {
    id: 'chat',
    title: t('panel.title'),
    icon: 'robot-happy-outline',
    defaultWidth: 420,
    render: ChatPanel,
  });

  ctx.ui.slot('topbar.item', {
    id: 'open-chat',
    title: t('panel.title'),
    icon: 'robot-happy-outline',
    onPress: () => ctx.ui.openDrawer('chat'),
  });

  ctx.ui.slot('game.actions', {
    id: 'ask-about-game',
    title: t('actions.ask'),
    icon: 'robot-happy-outline',
    run(game: Game) {
      ctx.ui.openDrawer('chat');
      chat.send(t('prompt.aboutGame', { name: game.name, id: game.id }));
    },
  });
}
