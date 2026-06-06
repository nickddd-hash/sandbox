import { useStore } from '../store';
import { NICHE_LIST } from '../config/niches';

// Переключатель ниши — меняет сценарий, поля карточки и ROI-параметры.
export function NicheSwitcher() {
  const niche = useStore((s) => s.niche);
  const setNiche = useStore((s) => s.setNiche);
  const status = useStore((s) => s.status);
  const live = status === 'live' || status === 'connecting';

  return (
    <div className="flex flex-wrap gap-2">
      {NICHE_LIST.map((n) => (
        <button
          key={n.id}
          disabled={live}
          onClick={() => setNiche(n.id)}
          className={`px-3 py-1.5 rounded-full text-sm border transition ${
            niche.id === n.id
              ? 'bg-accent border-accent text-white'
              : 'border-slate-600 text-slate-300 hover:border-slate-400'
          } ${live ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={live ? 'Недоступно во время разговора' : ''}
        >
          <span className="mr-1">{n.emoji}</span>
          {n.label}
        </button>
      ))}
    </div>
  );
}
