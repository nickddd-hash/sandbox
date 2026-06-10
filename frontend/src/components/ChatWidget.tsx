import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { sendChatMessage } from '../api';
import type { ToolEvent } from '../types';

// Текстовый виджет — напрямую через Hubris API (не Dasha).
export function ChatWidget() {
  const applyTool = useStore((s) => s.applyTool);
  const addMessage = useStore((s) => s.addMessage);
  const messages = useStore((s) => s.messages);
  const nicheId = useStore((s) => s.niche.id);

  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [draft, setDraft] = useState('');
  const historyRef = useRef<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (active && !loading) inputRef.current?.focus();
  }, [messages, loading, active]);

  // При смене ниши — сбрасываем чат (история другого агента неуместна)
  useEffect(() => {
    setActive(false);
    historyRef.current = [];
  }, [nicheId]);

  const handleResponse = (reply: string, toolCalls: { id: string; name: string; args: Record<string, unknown> }[]) => {
    if (reply) {
      addMessage({ from: 'agent', text: reply });
      historyRef.current.push({ role: 'assistant', content: reply });
    }
    for (const tc of toolCalls) {
      applyTool({ id: tc.id, name: tc.name, args: tc.args } as ToolEvent);
    }
  };

  const launch = async () => {
    setActive(true);
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

  const submit = async () => {
    const text = draft.trim();
    if (!text || loading) return;
    setDraft('');
    addMessage({ from: 'user', text });
    historyRef.current.push({ role: 'user', content: text });
    setLoading(true);
    try {
      const { reply, toolCalls } = await sendChatMessage(text, historyRef.current.slice(0, -1), nicheId);
      handleResponse(reply, toolCalls);
    } catch {
      addMessage({ from: 'agent', text: 'Ошибка. Попробуйте ещё раз.' });
    } finally {
      setLoading(false);
    }
  };

  const stop = () => {
    setActive(false);
    historyRef.current = [];
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm uppercase tracking-wide text-slate-400">💬 Чат с ИИ</div>
        {active && (
          <button onClick={stop} className="text-xs text-red-400 hover:text-red-300">
            завершить
          </button>
        )}
      </div>

      <div
        ref={listRef}
        className="flex-1 min-h-[160px] max-h-[260px] overflow-y-auto space-y-2 pr-1"
      >
        {messages.length === 0 && (
          <p className="text-slate-600 text-sm">История появится здесь…</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              m.from === 'agent'
                ? 'bg-slate-800 text-slate-100'
                : 'bg-accent/80 text-white ml-auto'
            }`}
          >
            {m.text}
          </div>
        ))}
        {loading && (
          <div className="bg-slate-800 text-slate-400 rounded-lg px-3 py-2 text-sm max-w-[85%] animate-pulse">
            …
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {!active ? (
          <button
            onClick={launch}
            className="w-full py-2 rounded-lg bg-accent hover:bg-blue-500 text-white font-medium"
          >
            Начать чат
          </button>
        ) : (
          <>
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void submit()}
              placeholder="Напишите сообщение…"
              disabled={loading}
              className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-accent disabled:opacity-50"
            />
            <button
              onClick={() => void submit()}
              disabled={loading}
              className="px-4 rounded-lg bg-accent hover:bg-blue-500 text-white text-sm disabled:opacity-50"
            >
              ↑
            </button>
          </>
        )}
      </div>
    </div>
  );
}
