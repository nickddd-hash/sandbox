import { useEffect, useState } from 'react';
import { useStore } from '../store';

interface Props {
  onAccept: () => void;
}

// Имитация исходящего «обратного звонка» от ИИ: после запланированного интервала
// у пользователя «звонит» входящий (реактивация / напоминание о визите).
export function IncomingCallOverlay({ onAccept }: Props) {
  const pending = useStore((s) => s.pendingCallback);
  const clearCallback = useStore((s) => s.clearCallback);
  const agentName = useStore((s) => s.niche.agentName);
  const status = useStore((s) => s.status);
  const [ringing, setRinging] = useState(false);

  useEffect(() => {
    if (!pending) {
      setRinging(false);
      return;
    }
    // «Перезвон» звонит только ПОСЛЕ завершения текущего разговора — иначе два звонка разом.
    if (status === 'connecting' || status === 'live') return;
    const delay = Math.max(0, pending.fireAt - Date.now());
    const t = setTimeout(() => setRinging(true), delay);
    return () => clearTimeout(t);
  }, [pending, status]);

  if (!pending || !ringing) return null;

  const decline = () => {
    clearCallback();
    setRinging(false);
  };

  const accept = () => {
    setRinging(false);
    clearCallback();
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-panel p-6 text-center">
        <div className="text-xs uppercase tracking-wide text-emerald-400 mb-2">Входящий звонок</div>
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-600 flex items-center justify-center text-3xl mb-3 animate-pulse">
          📞
        </div>
        <p className="text-white font-medium">{agentName}</p>
        <p className="text-slate-400 text-sm mt-1 mb-6">{pending.reason}</p>

        <div className="flex gap-3">
          <button
            onClick={decline}
            className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            Отклонить
          </button>
          <button
            onClick={accept}
            className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            Ответить
          </button>
        </div>
      </div>
    </div>
  );
}
