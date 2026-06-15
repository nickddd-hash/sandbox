import { useStore } from '../store';
import type { RentalBooking } from '../store';

const CARS = [
  { id: 'granta',  name: 'Lada Granta',              price: 2500, match: ['granta', 'гранта'] },
  { id: 'logan',   name: 'Renault Logan',             price: 2800, match: ['logan', 'логан'] },
  { id: 'solaris', name: 'Hyundai Solaris',           price: 3200, match: ['solaris', 'солярис'] },
  { id: 'kia',     name: 'Kia Rio',                   price: 3000, match: ['rio', 'рио', 'kia', 'киа'] },
  { id: 'camry',   name: 'Toyota Camry',              price: 6000, match: ['camry', 'камри'] },
  { id: 'prado',   name: 'Toyota Land Cruiser Prado', price: 8500, match: ['prado', 'прадо', 'cruiser', 'крузер'] },
];

const DEMO_BOOKED: { carId: string; days: number[] }[] = [
  { carId: 'granta',  days: [1, 2] },
  { carId: 'logan',   days: [0, 3, 4] },
  { carId: 'solaris', days: [1, 5] },
  { carId: 'kia',     days: [2, 3] },
  { carId: 'camry',   days: [0] },
  { carId: 'prado',   days: [1, 2, 3] },
];

const MONTHS: Record<string, number> = {
  янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4,
  июн: 5, июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
};

function parseDate(s: string): Date | null {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const dmy = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (dmy) return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1]));
  const ru = s.match(/(\d{1,2})\s+(\S+)/);
  if (ru) {
    const day = Number(ru[1]);
    const mKey = ru[2].toLowerCase().slice(0, 3);
    const month = MONTHS[mKey];
    if (month !== undefined) return new Date(new Date().getFullYear(), month, day);
  }
  return null;
}

function dayStr(d: Date): string {
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', weekday: 'short' });
}

function today0(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextDays(n = 7): Date[] {
  const base = today0();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    return d;
  });
}

export function RentalBoard() {
  const rentals = useStore((s) => s.rentals);
  const check = useStore((s) => s.lastAvailabilityCheck);
  const days = nextDays(7);
  const base = today0();

  const demoSet = new Map<string, Set<number>>(
    DEMO_BOOKED.map(({ carId, days: ds }) => [carId, new Set(ds)]),
  );

  function bookingDayOffsets(b: RentalBooking): Set<number> {
    const from = parseDate(b.dateFrom);
    const to = parseDate(b.dateTo);
    const set = new Set<number>();
    if (!from) return set;
    const end = to ?? from;
    for (let d = new Date(from); d <= end; d.setDate(d.getDate() + 1)) {
      const offset = Math.round((d.getTime() - base.getTime()) / 86400000);
      if (offset >= 0 && offset < 7) set.add(offset);
    }
    if (set.size === 0) set.add(0);
    return set;
  }

  return (
    <section className="card board">
      <header className="board-head">
        <h3 className="board-title">
          <span className="board-ico grid-ico" />
          Доступность автомобилей
        </h3>
        <span className="board-sub">lend-auto.ru</span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <div
          className="av"
          style={{ gridTemplateColumns: `170px repeat(7, 1fr)` }}
        >
          <div className="av-corner">Автомобиль</div>
          {days.map((d, i) => (
            <div
              key={i}
              className={'av-dayhead' + (i === 0 ? ' av-dayhead--today' : '')}
            >
              <span className="av-dow">{dayStr(d)}</span>
            </div>
          ))}

          {CARS.map((car) => {
            const demoOccupied = demoSet.get(car.id) ?? new Set<number>();
            const liveRentals = rentals.filter((r) =>
              car.match.some((m) => r.car.toLowerCase().includes(m)),
            );
            const isChecked = check?.car
              ? car.match.some((m) => check.car.toLowerCase().includes(m))
              : false;

            return (
              <>
                <div
                  key={`head-${car.id}`}
                  className={'av-rowhead' + (isChecked ? ' av-row-checked' : '')}
                >
                  <span className="av-rowname">{car.name}</span>
                  <span className="av-rowprice">{car.price.toLocaleString('ru')} ₽/сут</span>
                  {isChecked && (
                    <span
                      style={{
                        fontSize: 11, fontWeight: 700, marginTop: 2,
                        color: check?.available ? 'var(--green)' : 'var(--danger)',
                      }}
                    >
                      {check?.available ? '● Свободно' : '● Занято'}
                    </span>
                  )}
                </div>
                {days.map((_, dayIdx) => {
                  const isDemoBooked = demoOccupied.has(dayIdx);
                  const liveBooking = liveRentals.find((r) =>
                    bookingDayOffsets(r).has(dayIdx),
                  );
                  const cls = liveBooking
                    ? 'av-cell--booked'
                    : isDemoBooked
                    ? 'av-cell--busy'
                    : 'av-cell--free';

                  return (
                    <div key={`${car.id}-${dayIdx}`} className={'av-cell ' + cls}>
                      {liveBooking ? (
                        <div style={{ width: '100%' }}>
                          <div style={{ fontWeight: 700, fontSize: 11 }}>Бронь</div>
                          {liveBooking.client && (
                            <div style={{ fontSize: 10, opacity: .8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {liveBooking.client}
                            </div>
                          )}
                        </div>
                      ) : isDemoBooked ? (
                        'Занято'
                      ) : null}
                    </div>
                  );
                })}
              </>
            );
          })}
        </div>
      </div>

      <div className="av-legend">
        <span className="lg"><i className="lg-sw lg-free" />Свободно</span>
        <span className="lg"><i className="lg-sw lg-busy" />Занято (демо)</span>
        <span className="lg"><i className="lg-sw lg-booked" />Забронировано в сессии</span>
      </div>

      {rentals.length === 0 && (
        <p className="board-foot">Бронирования появятся здесь, когда агент запишет клиента.</p>
      )}
    </section>
  );
}
