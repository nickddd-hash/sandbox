import { useStore } from '../store';
import type { RentalBooking } from '../store';

const CARS = [
  { id: 'granta',   name: 'Lada Granta',       price: 2500 },
  { id: 'logan',    name: 'Renault Logan',      price: 2800 },
  { id: 'solaris',  name: 'Hyundai Solaris',    price: 3200 },
  { id: 'kia',      name: 'Kia Rio',            price: 3000 },
  { id: 'camry',    name: 'Toyota Camry',       price: 6000 },
  { id: 'prado',    name: 'Toyota Land Cruiser Prado', price: 8500 },
];

// Демо-брони: занятые слоты (carId + смещение дня от сегодня).
const DEMO_BOOKED: { carId: string; days: number[] }[] = [
  { carId: 'granta',  days: [1, 2] },
  { carId: 'logan',   days: [0, 3, 4] },
  { carId: 'solaris', days: [1, 5] },
  { carId: 'kia',     days: [2, 3] },
  { carId: 'camry',   days: [0] },
  { carId: 'prado',   days: [1, 2, 3] },
];

// Попытка распарсить дату из строк вида "10 июня", "10 июня 2026", "2026-06-10".
const MONTHS: Record<string, number> = {
  янв: 0, фев: 1, мар: 2, апр: 3, май: 4, мая: 4, июн: 5, июл: 6, авг: 7, сен: 8, окт: 9, ноя: 10, дек: 11,
};

function parseDate(s: string): Date | null {
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const ru = s.match(/(\d{1,2})\s+(\S+)/);
  if (ru) {
    const day = Number(ru[1]);
    const mKey = ru[2].toLowerCase().slice(0, 3);
    const month = MONTHS[mKey];
    if (month !== undefined) {
      const year = new Date().getFullYear();
      return new Date(year, month, day);
    }
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

function BookingBadge({ booking }: { booking: RentalBooking }) {
  const fresh = Date.now() - booking.at < 2000;
  return (
    <div
      className={`rounded text-[10px] leading-tight px-1 py-0.5 bg-emerald-700/80 text-white truncate ${
        fresh ? 'animate-field-pop ring-1 ring-emerald-300' : ''
      }`}
      title={`${booking.client}${booking.city ? ', ' + booking.city : ''} · ${booking.dateFrom}–${booking.dateTo}`}
    >
      <span className="font-semibold">Забронировано</span>
      {booking.client && <span className="opacity-80"> · {booking.client}</span>}
    </div>
  );
}

export function RentalBoard() {
  const rentals = useStore((s) => s.rentals);
  const check = useStore((s) => s.lastAvailabilityCheck);
  const days = nextDays(7);
  const base = today0();

  const demoSet = new Map<string, Set<number>>(
    DEMO_BOOKED.map(({ carId, days: ds }) => [carId, new Set(ds)]),
  );

  // Для каждого booking парсим диапазон дат → набор смещений дней.
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
    // Если диапазон вне окна — занимаем первую доступную ячейку для видимости.
    if (set.size === 0) set.add(0);
    return set;
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🚗</span>
        <h2 className="text-base font-semibold text-slate-200">Доступность автомобилей</h2>
        <span className="text-xs text-slate-500">· lend-auto.ru</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Шапка с днями */}
          <div className="grid grid-cols-[170px_repeat(7,1fr)] gap-1 mb-2">
            <div className="text-xs text-slate-500 px-1">Автомобиль</div>
            {days.map((d, i) => (
              <div
                key={i}
                className={`text-center text-[11px] py-1 rounded ${
                  i === 0 ? 'bg-accent/30 text-white' : 'text-slate-400'
                }`}
              >
                {dayStr(d)}
              </div>
            ))}
          </div>

          {/* Строки по автомобилям */}
          {CARS.map((car) => {
            const demoOccupied = demoSet.get(car.id) ?? new Set();
            const liveRentals = rentals.filter((r) =>
              r.car.toLowerCase().includes(car.name.split(' ')[1].toLowerCase()) ||
              car.name.toLowerCase().includes(r.car.toLowerCase()),
            );
            const isChecked = check?.car
              ? car.name.toLowerCase().includes(check.car.toLowerCase()) ||
                check.car.toLowerCase().includes(car.name.split(' ')[1].toLowerCase())
              : false;

            return (
              <div
                key={car.id}
                className={`grid grid-cols-[170px_repeat(7,1fr)] gap-1 mb-1 rounded-lg ${
                  isChecked
                    ? check?.available
                      ? 'ring-1 ring-emerald-500/60 bg-emerald-900/10'
                      : 'ring-1 ring-rose-500/60 bg-rose-900/10'
                    : ''
                }`}
              >
                {/* Ярлык авто */}
                <div className="flex flex-col justify-center px-2 py-1">
                  <span className="text-sm text-slate-200 font-medium leading-tight">{car.name}</span>
                  <span className="text-[11px] text-slate-500">{car.price.toLocaleString('ru')} ₽/сут</span>
                  {isChecked && (
                    <span
                      className={`text-[10px] mt-0.5 font-semibold ${
                        check?.available ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {check?.available ? '● Свободно' : '● Занято'}
                    </span>
                  )}
                </div>

                {/* Ячейки дней */}
                {days.map((_, dayIdx) => {
                  const isDemoBooked = demoOccupied.has(dayIdx);
                  const liveBooking = liveRentals.find((r) => {
                    const offsets = bookingDayOffsets(r);
                    return offsets.has(dayIdx);
                  });

                  return (
                    <div
                      key={dayIdx}
                      className={`min-h-[46px] rounded border p-0.5 ${
                        liveBooking
                          ? 'border-emerald-700/60 bg-emerald-900/20'
                          : isDemoBooked
                          ? 'border-slate-700 bg-slate-800/60'
                          : 'border-slate-800 bg-slate-800/20'
                      }`}
                    >
                      {liveBooking ? (
                        <BookingBadge booking={liveBooking} />
                      ) : isDemoBooked ? (
                        <div className="text-[10px] text-slate-500 px-1 py-0.5 leading-tight">
                          Занято
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Легенда */}
      <div className="flex items-center gap-4 mt-4 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-slate-800/60 border border-slate-700" />
          Занято (демо)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-emerald-900/40 border border-emerald-700/60" />
          Забронировано (сессия)
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-3 h-3 rounded bg-slate-800/20 border border-slate-800" />
          Свободно
        </span>
      </div>

      {rentals.length === 0 && (
        <p className="text-xs text-slate-600 mt-3">
          Бронирования появятся здесь, когда агент запишет клиента.
        </p>
      )}
    </section>
  );
}
