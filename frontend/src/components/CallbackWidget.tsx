import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { startCallback } from '../api';

type State = 'idle' | 'calling' | 'live' | 'error';

interface ToolEvent {
  type?: string;
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
}

export function CallbackWidget() {
  const [phone, setPhone] = useState('');
  const [state, setState] = useState<State>('idle');
  const [error, setError] = useState('');
  const esRef = useRef<EventSource | null>(null);

  const niche = useStore((s) => s.niche.id);
  const applyTool = useStore((s) => s.applyTool);

  useEffect(() => () => esRef.current?.close(), []);

  async function initiate() {
    const normalized = phone.trim();
    if (!normalized) return;

    setState('calling');
    setError('');

    try {
      const { sessionId } = await startCallback(normalized, niche);

      const es = new EventSource(`/api/session/${sessionId}/events`);
      esRef.current = es;

      es.onmessage = (e: MessageEvent<string>) => {
        let event: ToolEvent;
        try { event = JSON.parse(e.data) as ToolEvent; } catch { return; }
        if (event.type === 'connected') { setState('live'); return; }
        if (event.name) {
          applyTool({ id: event.id ?? crypto.randomUUID(), name: event.name, args: event.args ?? {} });
        }
      };

      es.onerror = () => {
        setState('error');
        setError('Потеряно соединение с сервером');
      };

      setState('live');
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Не удалось выполнить звонок');
    }
  }

  function reset() {
    esRef.current?.close();
    esRef.current = null;
    setState('idle');
    setPhone('');
    setError('');
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="text-sm uppercase tracking-wide text-slate-400 mb-3">📱 Звонок на телефон</div>

      {state === 'idle' && (
        <>
          <p className="text-xs text-slate-400 mb-3">
            Введите номер — ИИ-менеджер позвонит вам
          </p>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void initiate()}
              placeholder="+7 900 000 00 00"
              className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() => void initiate()}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium whitespace-nowrap"
            >
              Позвонить
            </button>
          </div>
        </>
      )}

      {state === 'calling' && (
        <p className="text-amber-300 text-sm text-center py-3 animate-pulse">
          Соединяем…
        </p>
      )}

      {state === 'live' && (
        <div className="text-center py-3">
          <div className="w-12 h-12 rounded-full bg-emerald-600 animate-pulse flex items-center justify-center text-2xl mx-auto mb-2">
            📱
          </div>
          <p className="text-emerald-300 text-sm font-medium mb-1">Звоним на {phone}</p>
          <p className="text-slate-400 text-xs mb-4">CRM заполняется в реальном времени</p>
          <button onClick={reset} className="text-xs text-slate-500 hover:text-slate-300">
            Сбросить
          </button>
        </div>
      )}

      {state === 'error' && (
        <div className="text-center py-3">
          <p className="text-red-400 text-sm mb-1">Ошибка</p>
          {error && <p className="text-slate-400 text-xs mb-3">{error}</p>}
          <button
            onClick={reset}
            className="text-xs px-3 py-1.5 rounded border border-slate-600 text-slate-400 hover:text-slate-200"
          >
            Попробовать снова
          </button>
        </div>
      )}
    </div>
  );
}
