import { useState } from 'react';
import { useStore } from '../store';
import type { Appointment } from '../store';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const HOURS = Array.from({ length: 11 }, (_, i) => 10 + i); // 10:00–20:00

function dayToIndex(day: string, todayIdx: number): number | null {
  const d = day.toLowerCase().trim();
  if (d.includes('сегодн')) return todayIdx;
  if (d.includes('завтра')) return (todayIdx + 1) % 7;
  const dateMatch = d.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (dateMatch) {
    const dt = new Date(Number(dateMatch[3]), Number(dateMatch[2]) - 1, Number(dateMatch[1]));
    return (dt.getDay() + 6) % 7;
  }
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

function ApptModal({ a, onClose }: { a: Appointment; onClose: () => void }) {
  return (
    <div className="hood-overlay" onClick={onClose}>
      <div className="hood" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div className="hood-head">
          <h3>Детали записи</h3>
          <button className="hood-x" onClick={onClose}>✕</button>
        </div>
        <div className="hood-list">
          {([
            ['Услуга', a.service],
            a.client ? ['Клиент', a.client] : null,
            a.master ? ['Мастер / врач', a.master] : null,
            ['День', a.day],
            ['Время', a.time],
            ['Статус', 'Подтверждена'],
          ] as (string[] | null)[])
            .filter((x): x is string[] => x !== null)
            .map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '6px 0', borderBottom: '1px solid var(--border-2)' }}>
                <span style={{ color: 'var(--text-2)' }}>{label}</span>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>{value}</span>
              </div>
            ))}
        </div>
      </div>
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
    <section className="card board">
      <header className="board-head">
        <h3 className="board-title">
          <span className="board-ico cal-ico" />
          Календарь записей
        </h3>
        <span className="board-sub">{niche.label}</span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <div
          className="cal"
          style={{ gridTemplateColumns: `48px repeat(7, 1fr)` }}
        >
          <div />
          {days.map((d, i) => (
            <div
              key={i}
              className={'cal-dayhead' + (i === todayIdx ? ' cal-dayhead--today' : '')}
            >
              <span className="cal-dow">{WEEKDAYS[i]}</span>
              <span className="cal-dnum">{d.getDate()}</span>
            </div>
          ))}

          {HOURS.map((h) => (
            <>
              <div key={`t-${h}`} className="cal-time">{h}:00</div>
              {days.map((_, col) => {
                const items = cells.get(`${col}-${h}`) ?? [];
                const latest = items[items.length - 1];
                const isToday = col === todayIdx;
                return (
                  <div
                    key={`${col}-${h}`}
                    className={'cal-cell' + (isToday ? ' cal-cell--today' : '')}
                  >
                    {latest && (
                      <div
                        className={'event event--' + (Date.now() - latest.at < 1500 ? 'new' : 'busy')}
                        onClick={() => setSelected(latest)}
                        title={`${latest.time} · ${latest.service}${latest.client ? ' · ' + latest.client : ''}`}
                      >
                        <span className="event-name">{latest.time} {latest.service}</span>
                        {latest.client && <span className="event-sub">{latest.client}</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>

      {unplaced.length > 0 && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border-2)', paddingTop: 10 }}>
          <div className="board-sub" style={{ marginBottom: 6, textTransform: 'uppercase', fontSize: 11, letterSpacing: '.05em', fontWeight: 700 }}>
            Записи (вне сетки)
          </div>
          {unplaced.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelected(a)}
              style={{ display: 'block', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', padding: '4px 0' }}
            >
              {a.day} {a.time} — {a.service}{a.client ? ` · ${a.client}` : ''}
            </button>
          ))}
        </div>
      )}

      {appointments.length === 0 && (
        <p className="board-foot">Записи появятся здесь по ходу разговора.</p>
      )}

      {selected && <ApptModal a={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}
