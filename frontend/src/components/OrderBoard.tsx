import { useStore } from '../store';
import { formatRub } from '../roi';
import { orderTotals, FREE_KG, FLAT_DELIVERY } from '../order';

function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderBoard() {
  const order = useStore((s) => s.order);
  const history = useStore((s) => s.orderHistory);
  const bonus = useStore((s) => s.bonusPoints);
  const payment = useStore((s) => s.card.payment?.value);
  const nicheId = useStore((s) => s.niche.id);

  const { isWeight, weightKg, freeDelivery, grandTotal } = orderTotals(order, nicheId);
  const deliveryLabel = freeDelivery
    ? 'бесплатно'
    : isWeight
    ? 'договорная'
    : formatRub(FLAT_DELIVERY);

  return (
    <section className="card order-board">
      <header className="board-head">
        <h3 className="board-title">
          <span className="board-ico cal-ico" />
          Заказ
        </h3>
        {!isWeight && bonus > 0 && (
          <span className="bonus-pill">★ Бонусы: {bonus}</span>
        )}
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap)' }}>
        {/* Корзина */}
        <div>
          <div className="order-section-label">Корзина</div>
          {order.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>
              Позиции появятся по ходу разговора…
            </p>
          )}
          {order.map((it) => {
            const unit = it.unit || 'шт';
            return (
              <div key={it.id} className="order-item">
                <div>
                  <div className="order-item-name">{it.name}</div>
                  <div className="order-item-qty">
                    {it.qty} {unit} × {formatRub(it.price)}{it.unit ? `/${it.unit}` : ''}
                  </div>
                </div>
                <span className="order-item-price">{formatRub(it.price * it.qty)}</span>
              </div>
            );
          })}

          {order.length > 0 && (
            <div className="order-totals">
              {isWeight && (
                <div className="order-total-row">
                  <span>Вес заказа</span>
                  <span className={freeDelivery ? 'order-free' : ''}>{weightKg} кг</span>
                </div>
              )}
              <div className="order-total-row">
                <span>Доставка</span>
                <span className={freeDelivery ? 'order-free' : ''}>
                  {deliveryLabel}
                  {isWeight && !freeDelivery && (
                    <span style={{ color: 'var(--text-3)' }}> · от {FREE_KG} кг бесплатно</span>
                  )}
                </span>
              </div>
              <div className="order-total-row" style={{ fontWeight: 600, color: 'var(--text)' }}>
                <span>Итого</span>
                <span className="order-grand-val">{formatRub(grandTotal)}</span>
              </div>
              {payment && (
                <div className="order-total-row">
                  <span>Оплата</span>
                  <span style={{ color: 'var(--text)' }}>{payment}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* История */}
        <div>
          <div className="order-section-label">История заказов</div>
          {history.length === 0 && (
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>Прошлых заказов нет.</p>
          )}
          {history.map((rec) => (
            <div key={rec.id} className="order-history-item">
              <div className="order-history-meta">
                <span>{fmtDateTime(rec.placedAt)}</span>
                <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatRub(rec.total)}</span>
              </div>
              <div className="order-history-items">
                {rec.items.map((i) => `${i.name} — ${i.qty} ${i.unit || 'шт'}`).join('; ')}
              </div>
              {rec.deliveryTime && (
                <div className="order-history-delivery">доставка: {rec.deliveryTime}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
