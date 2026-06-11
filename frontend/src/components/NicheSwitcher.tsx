import { useStore } from '../store';
import { NICHE_LIST } from '../config/niches';

export function NicheSwitcher() {
  const niche = useStore((s) => s.niche);
  const setNiche = useStore((s) => s.setNiche);
  const status = useStore((s) => s.status);
  const live = status === 'live' || status === 'connecting';

  return (
    <div className="seg" role="tablist">
      {NICHE_LIST.map((n) => (
        <button
          key={n.id}
          role="tab"
          disabled={live}
          onClick={() => setNiche(n.id)}
          className={'seg-btn' + (niche.id === n.id ? ' seg-btn--on' : '')}
          title={live ? 'Недоступно во время разговора' : ''}
        >
          {n.emoji} {n.label}
        </button>
      ))}
    </div>
  );
}
