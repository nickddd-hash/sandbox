import { useState } from 'react';
import { useStore } from '../store';
import type { Appointment } from '../store';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 11 }, (_, i) => 10 + i); // 10:00–20:00

// Понедельник-индекс (Пн=0) для строки дня агента.
function dayToIndex(day: string, todayIdx: number): number | null {
  const d = day.toLowerCase().trim();
  if (d.includes('сегодн')) return todayIdx;
  if (d.includes('завтра')) return (todayIdx + 1) % 7;
  const map: [string, number][] = [
    ['понедельник', 0], ['пн', 0],
    ['вторник', 1], ['вт', 1],
    ['среда', 2], ['ср', 2],
    ['четверг', 3], ['чт', 3],
    ['пятниц', 4], ['пт', 4],
    ['суббот', 5], ['сб', 5],
    ['воскрес', 6], ['вс', 6],
  ];
  for (const [k, v] of map) if (d.includes(k)) return v;
  return null;
}

function parseHour(time: string): number | null {
  const m = time.match(/(\d{1,2})[:.\s]/);
  if (m) return Number(m[1]);
  const h = time.match(/^(\d{1,2})$/);
  return h ? Number(h[1]) : null;
}

function thisMonday(): Date {
  const now = new Date();
  const dow = (now.getDay() + 6) % 7;
  const mon = new Date(now);
  mon.setDate(now.getDate() - dow);
  mon.setHours(0, 0, 0, 0);
  return mon;
}

function ApptBlock({ a, onClick }: { a: Appointment; onClick: () => void }) {
  const recent = Date.now() - a.at < 1500;
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left rounded-md bg-emerald-600/80 hover:bg-emerald-500 text-white text-[10px] leading-tight px-1.5 py-1 mb-0.5 ${
        recent ? 'animate-field-pop ring-1 ring-emerald-300' : ''
      }`}
      title={`${a.time} · ${a.service}${a.client ? ' · ' + a.client : ''}`}
    >
      <div className="font-semibold">{a.time}</div>
      <div className="truncate">{a.service}</div>
      {a.client && <div className="truncate opacity-80">{a.client}</div>}
    </button>
  );
}

// Модалка с деталями записи.
function ApptDetails({ a, onClose }: { a: Appointment; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Детали записи</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">✕</button>
        </div>
        <dl className="space-y-2 text-sm">
          <Row label="Услуга" value={a.service} />
          {a.client && <Row label="Клиент" value={a.client} />}
          {a.master && <Row label="Мастер" value={a.master} />}
          <Row label="День" value={a.day} />
          <Row label="Время" value={a.time} />
          <Row label="Статус" value="Подтверждена" />
        </dl>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md bg-slate-800/50 px-3 py-2">
      <dt className="text-slate-400">{label}</dt>
      <dd className="text-white font-medium">{value}</dd>
    </div>
  );
}

export function Calendar() {
  const appointments = useStore((s) => s.appointments);
  const niche = useStore((s) => s.niche);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const monday = thisMonday();
  const todayIdx = (new Date().getDay() + 6) % 7;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  // Раскладываем записи по ячейкам; нераспознанные — в список под сеткой.
  const cells = new Map<string, Appointment[]>();
  const unplaced: Appointment[] = [];
  for (const a of appointments) {
    const col = dayToIndex(a.day, todayIdx);
    const hour = parseHour(a.time);
    if (col === null || hour === null || hour < HOURS[0] || hour > HOURS[HOURS.length - 1]) {
      unplaced.push(a);
      continue;
    }
    const key = `${col}-${hour}`;
    cells.set(key, [...(cells.get(key) ?? []), a]);
  }

  return (
    <section className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🗓️</span>
        <h2 className="text-base font-semibold text-slate-200">Календарь записей</h2>
        <span className="text-xs text-slate-500">· {niche.label}</span>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Заголовок дней */}
          <div className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
            <div />
            {days.map((d, i) => (
              <div
                key={i}
                className={`text-center text-xs py-1 rounded ${
                  i === todayIdx ? 'bg-accent/30 text-white' : 'text-slate-400'
                }`}
              >
                {WEEKDAYS[i]} {d.getDate()}
              </div>
            ))}
          </div>

          {/* Часовые строки */}
          {HOURS.map((h) => (
            <div key={h} className="grid grid-cols-[48px_repeat(7,1fr)] gap-1 mb-1">
              <div className="text-[11px] text-slate-500 text-right pr-1 pt-1">{h}:00</div>
              {days.map((_, col) => {
                const items = cells.get(`${col}-${h}`) ?? [];
                return (
                  <div
                    key={col}
                    className={`min-h-[34px] rounded border border-slate-800 ${
                      col === todayIdx ? 'bg-slate-800/40' : 'bg-slate-800/20'
                    } p-0.5`}
                  >
                    {items.map((a) => (
                      <ApptBlock key={a.id} a={a} onClick={() => setSelected(a)} />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {unplaced.length > 0 && (
        <div className="mt-3 border-t border-slate-700 pt-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-1">Записи</div>
          {unplaced.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              className="block w-full text-left text-sm text-slate-300 hover:text-white"
            >
              {a.day} {a.time} — {a.service}
              {a.client ? ` · ${a.client}` : ''}
            </button>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <p className="text-xs text-slate-600 mt-2">Записи появятся здесь по ходу разговора.</p>
      )}

      {selected && <ApptDetails a={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
