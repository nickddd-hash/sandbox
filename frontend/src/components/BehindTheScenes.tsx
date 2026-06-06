import { useStore } from '../store';

// «Под капотом» — лог client-side tool-вызовов агента. Для технической аудитории:
// видно, как ИИ «дёргает функции» во время разговора.
export function BehindTheScenes() {
  const show = useStore((s) => s.showBehindScenes);
  const log = useStore((s) => s.toolLog);
  const toggle = useStore((s) => s.toggleBehindScenes);

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-80 max-h-[60vh] overflow-y-auto rounded-xl border border-slate-700 bg-black/90 p-4 text-xs font-mono">
      <div className="flex items-center justify-between mb-2">
        <span className="text-emerald-400">▶ под капотом · tool-вызовы</span>
        <button onClick={toggle} className="text-slate-500 hover:text-slate-300">✕</button>
      </div>
      {log.length === 0 && <p className="text-slate-600">Пока пусто — начните разговор.</p>}
      <ul className="space-y-1.5">
        {log.map((e) => (
          <li key={e.id} className="text-slate-300">
            <span className="text-amber-400">{e.name}</span>(
            <span className="text-slate-400">{JSON.stringify(e.args)}</span>)
          </li>
        ))}
      </ul>
    </div>
  );
}
