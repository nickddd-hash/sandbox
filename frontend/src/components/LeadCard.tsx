import { useStore } from '../store';

function scoreColor(score: number): string {
  if (score >= 85) return 'bg-red-500/20 text-red-300 border-red-500/40';
  if (score >= 60) return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
  return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
}

// Карточка лида: поля заполняются в реальном времени по tool-вызовам агента.
export function LeadCard() {
  const niche = useStore((s) => s.niche);
  const card = useStore((s) => s.card);
  const summary = useStore((s) => s.summary);
  const score = useStore((s) => s.score);
  const sentiment = useStore((s) => s.sentiment);

  const filled = Object.keys(card).length > 0;

  return (
    <div className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm uppercase tracking-wide text-slate-400">Карточка лида</h3>
        {score != null && (
          <span className={`text-xs px-2 py-1 rounded-full border ${scoreColor(score)}`}>
            Скоринг {score}{sentiment ? ` · ${sentiment}` : ''}
          </span>
        )}
      </div>

      <dl className="space-y-2">
        {niche.fields.map((f) => {
          const cell = card[f.key];
          const recent = cell && Date.now() - cell.updatedAt < 1300;
          return (
            <div
              key={f.key}
              className={`flex items-center justify-between rounded-md px-3 py-2 ${
                recent ? 'animate-field-pop' : ''
              } ${cell ? 'bg-slate-800/60' : 'bg-slate-800/20'}`}
            >
              <dt className="text-slate-400 text-sm">{f.label}</dt>
              <dd className={`text-sm ${cell ? 'text-white font-medium' : 'text-slate-600'}`}>
                {cell ? cell.value : '—'}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-4 border-t border-slate-700 pt-3">
        <div className="text-xs uppercase tracking-wide text-slate-400 mb-1">Авто-саммари</div>
        <p className={`text-sm ${summary ? 'text-slate-200' : 'text-slate-600 italic'}`}>
          {summary ?? (filled ? 'Формируется по завершении разговора…' : 'Появится после разговора')}
        </p>
      </div>
    </div>
  );
}
