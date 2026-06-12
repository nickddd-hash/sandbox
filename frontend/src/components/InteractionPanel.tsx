import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { sendChatMessage } from '../api';
import type { ToolEvent } from '../types';

interface Props {
  onLaunch: () => void;
  onStop: () => void;
}

function PhoneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M6.2 3.2 4.4 3C3.6 3 3 3.7 3.1 4.5 3.7 9.6 8.4 14.3 13.5 14.9c.8.1 1.5-.5 1.5-1.3l-.2-1.8c-.1-.5-.5-.9-1-1l-1.9-.3c-.4-.1-.8.1-1 .4l-.6.8c-1.6-.8-2.9-2.1-3.7-3.7l.8-.6c.3-.2.5-.6.4-1L7.5 4.2c-.1-.5-.6-.9-1.3-1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 4.5C3 3.7 3.7 3 4.5 3h9c.8 0 1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5H7l-3 2.4V12H4.5C3.7 12 3 11.3 3 10.5v-6Z"
        stroke="currentColor"
        strokeWidth="1.4"
        fill="none"
      />
    </svg>
  );
}

function fmt(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export function InteractionPanel({ onLaunch, onStop }: Props) {
  const [tab, setTab] = useState<'call' | 'chat'>('call');

  // Voice state
  const status = useStore((s) => s.status);
  const channel = useStore((s) => s.channel);
  const agentName = useStore((s) => s.niche.agentName);
  const setLastCallSec = useStore((s) => s.setLastCallSec);
  const setChannel = useStore((s) => s.setChannel);
  const voiceActive = (status === 'connecting' || status === 'live') && channel === 'voice';
  const [sec, setSec] = useState(0);

  // Chat state
  const applyTool = useStore((s) => s.applyTool);
  const addMessage = useStore((s) => s.addMessage);
  const messages = useStore((s) => s.messages);
  const nicheId = useStore((s) => s.niche.id);
  const [chatActive, setChatActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll chat
  useEffect(() => {
    if (tab === 'chat') {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages.length, loading, tab]);

  // Focus input when chat active
  useEffect(() => {
    if (tab === 'chat' && chatActive && !loading) inputRef.current?.focus();
  }, [messages, loading, chatActive, tab]);

  // Voice timer
  useEffect(() => {
    if (status === 'live' && channel === 'voice') {
      setSec(0);
      const t = setInterval(() => setSec((x) => x + 1), 1000);
      return () => clearInterval(t);
    }
    if (status === 'ended' && channel === 'voice') {
      setLastCallSec(sec);
    }
  }, [status, channel]);

  // Reset chat on niche change
  useEffect(() => {
    setChatActive(false);
    setDraft('');
    historyRef.current = [];
  }, [nicheId]);

  const handleResponse = (
    reply: string,
    toolCalls: { id: string; name: string; args: Record<string, unknown> }[],
  ) => {
    if (reply) {
      addMessage({ from: 'agent', text: reply });
      historyRef.current.push({ role: 'assistant', content: reply });
    }
    for (const tc of toolCalls) {
      applyTool({ id: tc.id, name: tc.name, args: tc.args } as ToolEvent);
    }
  };

  const launchChat = async () => {
    setChatActive(true);
    setLoading(true);
    historyRef.current = [];
    try {
      const { reply, toolCalls } = await sendChatMessage(undefined, [], nicheId);
      handleResponse(reply, toolCalls);
    } catch {
      addMessage({ from: 'agent', text: 'Ошибка соединения. Попробуйте ещё раз.' });
    } finally {
      setLoading(false);
    }
  };

  const submitChat = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft('');
    addMessage({ from: 'user', text });
    historyRef.current.push({ role: 'user', content: text });
    setLoading(true);
    try {
      const { reply, toolCalls } = await sendChatMessage(
        text,
        historyRef.current.slice(0, -1),
        nicheId,
      );
      handleResponse(reply, toolCalls);
    } catch {
      addMessage({ from: 'agent', text: 'Ошибка. Попробуйте ещё раз.' });
    } finally {
      setLoading(false);
    }
  };

  const stopChat = () => {
    setChatActive(false);
    historyRef.current = [];
  };

  const panelActive = tab === 'call' ? voiceActive : chatActive;
  const anyActive = voiceActive || chatActive;

  const statusText = (() => {
    if (tab === 'call') {
      if (status === 'connecting' && channel === 'voice') return 'Соединение…';
      if (status === 'live' && channel === 'voice') return 'Идёт разговор';
      if (status === 'ended') return 'Звонок завершён';
      if (status === 'error') return 'Ошибка соединения';
    } else {
      if (loading) return 'Печатает…';
      if (chatActive) return 'Онлайн';
    }
    return 'на линии';
  })();

  return (
    <section className="card panel">
      <header className="panel-head">
        <div className="tabs" role="tablist">
          <button
            className={'tab' + (tab === 'call' ? ' tab--on' : '')}
            onClick={() => { if (!anyActive) { setTab('call'); setChannel('voice'); } }}
            disabled={anyActive}
          >
            <PhoneIcon /> Звонок
          </button>
          <button
            className={'tab' + (tab === 'chat' ? ' tab--on' : '')}
            onClick={() => { if (!anyActive) { setTab('chat'); setChannel('chat'); } }}
            disabled={anyActive}
          >
            <ChatIcon /> Чат
          </button>
        </div>
        <span className="panel-live">
          <span className={'live-dot' + (panelActive ? ' live-dot--on' : '')} />
          {panelActive ? 'AI на линии' : 'Демо'}
        </span>
      </header>

      <div className="panel-agent">
        <div className={'agent-avatar' + (panelActive ? ' agent-avatar--active' : '')}>
          <span className="agent-initial">{agentName[0]}</span>
          {panelActive && (
            <span className="wave" aria-hidden="true">
              <i /><i /><i /><i /><i />
            </span>
          )}
        </div>
        <div className="agent-meta">
          <div className="agent-name">{agentName}</div>
          <div className={'agent-status' + (panelActive ? ' agent-status--live' : '')}>
            {statusText}
          </div>
        </div>
        {tab === 'call' && voiceActive && (
          <div className="agent-timer">{fmt(sec)}</div>
        )}
      </div>

      <div ref={tab === 'chat' ? scrollRef : undefined} className="thread">
        {tab === 'call' ? (
          <div className="thread-empty">
            {!voiceActive
              ? 'Нажмите «Позвонить» — ИИ-консультант ответит голосом, а карточка лида заполнится в реальном времени.'
              : status === 'connecting'
              ? 'Соединяем вас с ИИ-консультантом…'
              : 'Разговор идёт. Смотрите, как карточка лида заполняется в реальном времени.'}
          </div>
        ) : (
          <>
            {messages.length === 0 && !loading && (
              <div className="thread-empty">
                Напишите боту — переписка появится здесь, а данные клиента сами лягут в CRM.
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={'bubble-row' + (m.from === 'user' ? ' bubble-row--client' : '')}
              >
                <div className={'bubble' + (m.from === 'agent' ? ' bubble--ai' : ' bubble--client')}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="bubble-row">
                <div className="bubble bubble--ai bubble--typing">
                  <span className="typing">
                    <i /><i /><i />
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="panel-foot">
        {tab === 'chat' && (
          <div className="chat-input">
            {chatActive ? (
              <>
                <input
                  ref={inputRef}
                  className="chat-input-real"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void submitChat()}
                  placeholder="Напишите сообщение…"
                  disabled={loading}
                />
                <button
                  className="chat-send"
                  onClick={() => void submitChat()}
                  disabled={loading}
                >
                  ↑
                </button>
              </>
            ) : (
              <span className="chat-input-ph">Сообщение боту…</span>
            )}
          </div>
        )}
        {!panelActive ? (
          <button
            className={'cta cta--' + tab}
            onClick={tab === 'call' ? onLaunch : () => void launchChat()}
          >
            {tab === 'call' ? (
              <><PhoneIcon /> Позвонить</>
            ) : (
              <><ChatIcon /> Начать чат</>
            )}
          </button>
        ) : (
          <button
            className="cta cta--stop"
            onClick={tab === 'call' ? onStop : stopChat}
          >
            <span className="stop-sq" />
            {tab === 'call' ? 'Завершить звонок' : 'Остановить'}
          </button>
        )}
      </div>
    </section>
  );
}
