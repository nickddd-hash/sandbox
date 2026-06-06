import { useState } from 'react';
import { useStore } from '../store';
import { formatRub, monthly, perCall } from '../roi';

// Панель экономики: стоимость обращения ИИ vs живой менеджер, накопленная экономия
// за сессию и персональный расчёт под вводные посетителя.
export function RoiPanel() {
  const niche = useStore((s) => s.niche);
  const savedTotal = useStore((s) => s.savedTotal);
  const pc = perCall(niche.roi);

  const [callsPerDay, setCallsPerDay] = useState(niche.roi.defaultCallsPerDay);
  const m = monthly(niche.roi, callsPerDay);

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="text-sm uppercase tracking-wide text-slate-400 mb-3">📊 Экономика</div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400">Обработка ИИ</div>
          <div className="text-lg font-semibold text-emerald-400">{formatRub(pc.aiCost)}</div>
        </div>
        <div className="rounded-lg bg-slate-800/60 p-3">
          <div className="text-xs text-slate-400">Живой менеджер</div>
          <div className="text-lg font-semibold text-slate-300">{formatRub(pc.humanCost)}</div>
        </div>
      </div>

      <div className="rounded-lg bg-emerald-950/30 border border-emerald-800/40 p-3 mb-4">
        <div className="text-xs text-emerald-400">Сэкономлено за эту сессию</div>
        <div className="text-2xl font-bold text-emerald-300 tabular-nums">{formatRub(savedTotal)}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          накопительно: {formatRub(pc.savedPerCall)} за каждый завершённый разговор
        </div>
      </div>

      <div className="border-t border-slate-700 pt-3">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">
          Расчёт под ваш бизнес
        </div>
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

        <div className="space-y-1.5 text-sm">
          <Row label="Обращений в месяц" value={m.callsPerMonth.toLocaleString('ru-RU')} />
          <Row label="Экономия на обработке" value={formatRub(m.laborSaving)} />
          <Row label="Предотвращённые потери" value={formatRub(m.missedSaving)} hint="пропущенные звонки 24/7" />
          <div className="flex items-center justify-between border-t border-slate-700 pt-2 mt-1">
            <span className="text-slate-200 font-medium">Итого в месяц</span>
            <span className="text-emerald-300 font-bold text-lg">{formatRub(m.total)}</span>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-3">
          Оценка по нише «{niche.label}». Факты в пользу ИИ: ответ за 0 сек, 0 пропущенных, 24/7,
          данные внесены без ручного ввода.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-400">
        {label}
        {hint && <span className="text-slate-600"> · {hint}</span>}
      </span>
      <span className="text-slate-100 tabular-nums">{value}</span>
    </div>
  );
}
