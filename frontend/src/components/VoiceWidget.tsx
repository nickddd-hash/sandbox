import { useEffect, useState } from 'react';
import { useStore } from '../store';

interface Props {
  onLaunch: () => void;
  onStop: () => void;
}

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Голосовой виджет — имитация телефонного звонка. Без транскрипта: внимание на CRM.
export function VoiceWidget({ onLaunch, onStop }: Props) {
  const status = useStore((s) => s.status);
  const channel = useStore((s) => s.channel);
  const agentName = useStore((s) => s.niche.agentName);
  const setLastCallSec = useStore((s) => s.setLastCallSec);
  const active = (status === 'connecting' || status === 'live') && channel === 'voice';
  const [sec, setSec] = useState(0);

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

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="text-sm uppercase tracking-wide text-slate-400 mb-3">📞 Звонок ИИ-консультанту</div>

      <div className="flex flex-col items-center py-4">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-3 ${
            active ? 'bg-emerald-600 animate-pulse' : 'bg-slate-700'
          }`}
        >
          {active ? '🎙️' : '📞'}
        </div>

        <div className="text-center min-h-[2.5rem]">
          {status === 'idle' && <p className="text-slate-400 text-sm">Нажмите, чтобы позвонить</p>}
          {status === 'connecting' && channel === 'voice' && (
            <p className="text-amber-300 text-sm">Соединяем…</p>
          )}
          {status === 'live' && channel === 'voice' && (
            <>
              <p className="text-emerald-300 text-sm font-medium">{agentName}</p>
              <p className="text-slate-400 text-xs tabular-nums">{fmt(sec)}</p>
            </>
          )}
          {status === 'ended' && <p className="text-slate-400 text-sm">Звонок завершён</p>}
          {status === 'error' && <p className="text-red-400 text-sm">Ошибка соединения</p>}
        </div>
      </div>

      {active ? (
        <button
          onClick={onStop}
          className="w-full py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-medium"
        >
          Завершить
        </button>
      ) : (
        <button
          onClick={onLaunch}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
        >
          Позвонить
        </button>
      )}
    </div>
  );
}
