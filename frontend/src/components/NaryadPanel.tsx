import { useStore } from '../store';
import { formatRub } from '../roi';

// «Наряд исполнителю» — ролевой вид заказа/записи для того, кто его выполняет:
// повар/флорист/комплектовщик + курьер (order), мастер/врач/риэлтор (calendar),
// менеджер выдачи (rental). Выводится из уже собранных данных, без отдельных tool.

const ROLE: Record<string, { icon: string; title: string; doLabel: string }> = {
  food: { icon: '👨‍🍳', title: 'Наряд: кухня + доставка', doLabel: 'Приготовить' },
  meat: { icon: '📦', title: 'Наряд: склад + доставка', doLabel: 'Скомплектовать' },
  flowers: { icon: '💐', title: 'Наряд: сборка + доставка', doLabel: 'Собрать букет' },
  salon: { icon: '💇', title: 'Наряд мастеру', doLabel: '' },
  dental: { icon: '🦷', title: 'Наряд врачу', doLabel: '' },
  auto: { icon: '🔧', title: 'Наряд механику', doLabel: '' },
  realty: { icon: '🏠', title: 'Наряд риэлтору', doLabel: '' },
  lendauto: { icon: '🚗', title: 'Наряд на выдачу авто', doLabel: '' },
};

function Line({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="naryad-line">
      <span className="naryad-line-l">{label}</span>
      <span className="naryad-line-v">{value}</span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="naryad-empty">{text}</p>;
}

export function NaryadPanel() {
  const nicheId = useStore((s) => s.niche.id);
  const crmView = useStore((s) => s.niche.crmView);
  const card = useStore((s) => s.card);
  const order = useStore((s) => s.order);
  const history = useStore((s) => s.orderHistory);
  const appointments = useStore((s) => s.appointments);
  const rentals = useStore((s) => s.rentals);

  const role = ROLE[nicheId] ?? { icon: '📋', title: 'Наряд исполнителю', doLabel: '' };
  const f = (k: string) => card[k]?.value || '';

  const header = (
    <header className="board-head">
      <h3 className="board-title">
        <span className="naryad-emoji">{role.icon}</span>
        {role.title}
      </h3>
      <span className="naryad-tag">передаётся исполнителю</span>
    </header>
  );

  // ───── ЗАКАЗ (повар/флорист/комплектовщик + курьер) ─────
  if (crmView === 'order') {
    const placed = history[history.length - 1];
    const hasData = order.length > 0 || !!placed;
    const total = order.reduce((sum, it) => sum + it.price * it.qty, 0);
    const deliveryTime = f('deliveryTime') || f('date') || placed?.deliveryTime || '';

    return (
      <section className="card naryad">
        {header}
        {!hasData ? (
          <Empty text="Наряд сформируется, как только заказ будет оформлен." />
        ) : (
          <div className="naryad-grid">
            <div className="naryad-block">
              <div className="naryad-block-h">{role.doLabel || 'Собрать'}</div>
              {order.map((it) => (
                <div key={it.id} className="naryad-task">
                  <span className="naryad-chk" />
                  <span className="naryad-task-q">
                    {it.qty} {it.unit || 'шт'}
                  </span>
                  <span className="naryad-task-n">{it.name}</span>
                </div>
              ))}
              {order.length === 0 && placed && (
                <div className="naryad-task-n" style={{ color: 'var(--text-2)' }}>
                  {placed.items.map((i) => `${i.qty} ${i.unit || 'шт'} ${i.name}`).join('; ')}
                </div>
              )}
            </div>
            <div className="naryad-block">
              <div className="naryad-block-h">Курьеру — доставка</div>
              <Line label="Кому" value={f('name')} />
              <Line label="Компания" value={f('company')} />
              <Line label="Телефон" value={f('phone')} />
              <Line label="Адрес" value={f('address')} />
              <Line label="Когда" value={deliveryTime} />
              <Line label="Оплата" value={f('payment')} />
              <Line
                label="Сумма заказа"
                value={total > 0 ? formatRub(total) : placed ? formatRub(placed.total) : ''}
              />
            </div>
          </div>
        )}
      </section>
    );
  }

  // ───── ВЫДАЧА АВТО (rental) ─────
  if (crmView === 'rental') {
    const b = rentals[rentals.length - 1];
    const car = b?.car || f('car');
    const hasData = !!car;
    const period =
      b?.dateFrom || b?.dateTo
        ? `${b?.dateFrom ?? ''} — ${b?.dateTo ?? ''}`
        : f('dateFrom') || f('dateTo')
        ? `${f('dateFrom')} — ${f('dateTo')}`
        : '';
    return (
      <section className="card naryad">
        {header}
        {!hasData ? (
          <Empty text="Наряд сформируется после брони автомобиля." />
        ) : (
          <div className="naryad-block">
            <div className="naryad-block-h">Подготовить к выдаче</div>
            <Line label="Автомобиль" value={car} />
            <Line label="Период" value={period} />
            <Line label="Клиент" value={b?.client || f('name')} />
            <Line label="Телефон" value={f('phone')} />
            <Line label="Город / точка" value={b?.city || f('city')} />
          </div>
        )}
      </section>
    );
  }

  // ───── ЗАПИСЬ К СПЕЦИАЛИСТУ (calendar) ─────
  const a = appointments[appointments.length - 1];
  const datetime = f('date') || (a ? `${a.day} ${a.time}`.trim() : '');
  const service = a?.service || f('service');
  const assignee = a?.master || f('master');
  const client = a?.client || f('name');
  const hasData = !!datetime || !!service || !!assignee;

  return (
    <section className="card naryad">
      {header}
      {!hasData ? (
        <Empty text="Наряд сформируется после записи." />
      ) : (
        <div className="naryad-block">
          <div className="naryad-block-h">{assignee ? `Исполнитель: ${assignee}` : 'К исполнению'}</div>
          <Line label="Когда" value={datetime} />
          <Line label="Услуга / работа" value={service} />
          {nicheId === 'auto' && <Line label="Автомобиль" value={f('car')} />}
          {nicheId === 'realty' && <Line label="Бюджет" value={f('budget')} />}
          <Line label="Клиент" value={client} />
          <Line label="Телефон" value={f('phone')} />
        </div>
      )}
    </section>
  );
}
