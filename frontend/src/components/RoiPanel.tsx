import { useState } from 'react';
import { useStore } from '../store';

const WORK_DAYS = 22;

// Объём обращений: пользователь вводит звонки/день. Без выдуманной «экономии» —
// точная стоимость считается по фактическому тарифу Dasha после подключения биллинга.
export function RoiPanel() {
  const niche = useStore((s) => s.niche);
  const [callsPerDay, setCallsPerDay] = useState(niche.roi.defaultCallsPerDay);
  const callsPerMonth = Math.round(callsPerDay * WORK_DAYS);

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="text-sm uppercase tracking-wide text-slate-400 mb-3">📊 Объём обращений</div>

      <label className="block text-sm text-slate-300 mb-3">
        Звонков в день: <span className="font-semibold text-white">{callsPerDay}</span>
        <input
          type="range"
          min={5}
          max={150}
          value={callsPerDay}
          onChange={(e) => setCallsPerDay(Number(e.target.value))}
          className="w-full mt-1 accent-emerald-500"
        />
      </label>

      <div className="flex items-center justify-between text-sm border-t border-slate-700 pt-3">
        <span className="text-slate-400">Обращений в месяц</span>
        <span className="text-white font-semibold tabular-nums">
          {callsPerMonth.toLocaleString('ru-RU')}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 mt-3">
        ИИ обрабатывает все обращения 24/7, без пропущенных и без ручного ввода. Точную
        стоимость и экономию посчитаем по фактическому тарифу Dasha и средней длительности
        звонка после подключения биллинга.
      </p>
    </div>
  );
}
