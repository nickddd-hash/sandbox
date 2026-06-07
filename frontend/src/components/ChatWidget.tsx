import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';

interface Props {
  onLaunch: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
}

// Текстовый виджет — общение с тем же ИИ-агентом в переписке.
export function ChatWidget({ onLaunch, onSend, onStop }: Props) {
  const status = useStore((s) => s.status);
  const channel = useStore((s) => s.channel);
  const messages = useStore((s) => s.messages);
  const [draft, setDraft] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  const active = (status === 'connecting' || status === 'live') && channel === 'chat';

  // Прокручиваем ТОЛЬКО внутренний контейнер чата, а не всю страницу.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm uppercase tracking-wide text-slate-400">💬 Чат с ИИ</div>
        {active && (
          <button onClick={onStop} className="text-xs text-red-400 hover:text-red-300">
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
      </div>

      <div className="mt-3 flex gap-2">
        {!active ? (
          <button
            onClick={onLaunch}
            className="w-full py-2 rounded-lg bg-accent hover:bg-blue-500 text-white font-medium"
          >
            Начать чат
          </button>
        ) : (
          <>
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Напишите сообщение…"
              className="flex-1 rounded-lg bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-accent"
            />
            <button
              onClick={submit}
              className="px-4 rounded-lg bg-accent hover:bg-blue-500 text-white text-sm"
            >
              ↑
            </button>
          </>
        )}
      </div>
    </div>
  );
}
