import { useStore } from '../store';

const RATE_PER_MIN = 8;

function fmt(sec: number): string {
  return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
}

export function RoiPanel() {
  const status = useStore((s) => s.status);
  const channel = useStore((s) => s.channel);
  const lastCallSec = useStore((s) => s.lastCallSec);

  const showResult =
    status === 'ended' && channel === 'voice' && lastCallSec !== null && lastCallSec > 0;
  const cost = lastCallSec ? (lastCallSec / 60) * RATE_PER_MIN : 0;

  return (
    <section className="card pricing">
      <div className="pricing-row">
        <div className="pricing-cell">
          <div className="pricing-cap">Стоимость минуты ИИ</div>
          <div className="pricing-val">8 ₽</div>
        </div>
        <div className="pricing-divider" />
        <div className="pricing-cell">
          <div className="pricing-cap">Длительность</div>
          <div className="pricing-val">{showResult ? fmt(lastCallSec!) : '—'}</div>
        </div>
        <div className="pricing-divider" />
        <div className="pricing-cell">
          <div className="pricing-cap">Стоимость разговора</div>
          <div className={'pricing-val pricing-val--accent'}>
            {showResult ? `${cost.toFixed(0)} ₽` : '—'}
          </div>
        </div>
      </div>
      {!showResult && (
        <p className="pricing-hint">
          Счётчик и стоимость появятся здесь после голосового разговора — клиент видит реальную экономику звонка.
        </p>
      )}
    </section>
  );
}
