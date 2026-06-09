import { useStore } from '../store';

const RATE_PER_MIN = 8; // ₽ за минуту разговора

function fmt(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? `${m} мин ${s} сек` : `${s} сек`;
}

export function RoiPanel() {
  const status = useStore((s) => s.status);
  const lastCallSec = useStore((s) => s.lastCallSec);

  const showResult = status === 'ended' && lastCallSec !== null && lastCallSec > 0;
  const cost = lastCallSec ? (lastCallSec / 60) * RATE_PER_MIN : 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="text-sm uppercase tracking-wide text-slate-400 mb-3">💰 Тарификация</div>

      <div className="flex items-center justify-between text-sm mb-2">
        <span className="text-slate-400">Стоимость минуты ИИ</span>
        <span className="text-white font-semibold">{RATE_PER_MIN} ₽</span>
      </div>


      {showResult ? (
        <div className="rounded-lg bg-emerald-900/30 border border-emerald-700/50 px-4 py-3 animate-field-pop">
          <div className="text-xs text-emerald-400 uppercase tracking-wide mb-1">Последний разговор</div>
          <div className="flex items-baseline justify-between">
            <span className="text-slate-300 text-sm">{fmt(lastCallSec!)}</span>
            <span className="text-emerald-300 font-bold text-lg">
              {cost < 1 ? '< 1' : cost.toFixed(1)} ₽
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {RATE_PER_MIN} ₽ × {(lastCallSec! / 60).toFixed(1)} мин
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500">
          После разговора здесь появится стоимость звонка.
        </p>
      )}
    </div>
  );
}
