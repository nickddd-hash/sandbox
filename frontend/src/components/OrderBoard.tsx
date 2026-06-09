import { useStore } from '../store';
import { formatRub } from '../roi';

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

  // Meat Foods — весовая B2B-ниша: доставка бесплатна от 15 кг (по Москве).
  const isWeight = nicheId === 'meat';
  const FREE_KG = 15;
  const FREE_RUB = 1000;
  const FLAT_DELIVERY = 200;

  const total = order.reduce((sum, it) => sum + it.price * it.qty, 0);
  const weightKg = order.reduce(
    (sum, it) => sum + ((it.unit || '').toLowerCase().startsWith('кг') ? it.qty : 0),
    0,
  );
  const freeDelivery = isWeight ? weightKg >= FREE_KG : total >= FREE_RUB;
  const grandTotal = isWeight ? total : total + (freeDelivery ? 0 : FLAT_DELIVERY);
  const deliveryLabel = freeDelivery ? 'бесплатно' : isWeight ? 'договорная' : formatRub(FLAT_DELIVERY);

  return (
    <section className="rounded-xl border border-slate-700 bg-panel/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧾</span>
        <h2 className="text-base font-semibold text-slate-200">Заказ</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Текущая корзина */}
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-400 mb-2">Корзина</div>
          {order.length === 0 && (
            <p className="text-sm text-slate-600">Позиции появятся по ходу разговора…</p>
          )}
          <div className="space-y-1.5">
            {order.map((it) => {
              const recent = Date.now() - it.at < 1500;
              const unit = it.unit || 'шт';
              const perUnit = it.unit ? `/${it.unit}` : '';
              return (
                <div
                  key={it.id}
                  className={`flex items-start justify-between gap-3 rounded-md px-3 py-2 text-sm bg-slate-800/50 ${
                    recent ? 'animate-field-pop' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-slate-200 truncate">{it.name}</div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {it.qty} {unit} × {formatRub(it.price)}
                      {perUnit}
                    </div>
                  </div>
                  <span className="text-white tabular-nums whitespace-nowrap">
                    {formatRub(it.price * it.qty)}
                  </span>
                </div>
              );
            })}
          </div>

          {order.length > 0 && (
            <div className="mt-3 border-t border-slate-700 pt-2 space-y-1 text-sm">
              {isWeight && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Вес заказа</span>
                  <span className={`tabular-nums ${freeDelivery ? 'text-emerald-400' : 'text-slate-200'}`}>
                    {weightKg} кг
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Доставка</span>
                <span className={freeDelivery ? 'text-emerald-400' : 'text-slate-200'}>
                  {deliveryLabel}
                  {isWeight && !freeDelivery && (
                    <span className="text-slate-500"> · бесплатно от {FREE_KG} кг</span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Итого</span>
                <span className="text-emerald-300 font-bold text-lg tabular-nums">
                  {formatRub(grandTotal)}
                </span>
              </div>
              {payment && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Оплата</span>
                  <span className="text-slate-200">{payment}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* История заказов + бонусы (карточка клиента / лояльность) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">История заказов</span>
            {!isWeight && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                ★ Бонусы: {bonus}
              </span>
            )}
          </div>
          {history.length === 0 && (
            <p className="text-sm text-slate-600">Прошлых заказов нет. Оформите первый!</p>
          )}
          <div className="space-y-2">
            {history.map((rec) => (
              <div key={rec.id} className="rounded-md bg-slate-800/40 px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-xs">{fmtDateTime(rec.placedAt)}</span>
                  <span className="text-white tabular-nums">{formatRub(rec.total)}</span>
                </div>
                <div className="text-slate-300 text-xs mt-0.5">
                  {rec.items.map((i) => `${i.name} — ${i.qty} ${i.unit || 'шт'}`).join('; ')}
                </div>
                {rec.deliveryTime && (
                  <div className="text-slate-500 text-xs mt-0.5">доставка: {rec.deliveryTime}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
