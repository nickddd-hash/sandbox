import { useStore } from '../store';
import { formatRub } from '../roi';

const FREE_DELIVERY_FROM = 1000;

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

  const total = order.reduce((sum, it) => sum + it.price * it.qty, 0);
  const freeDelivery = total >= FREE_DELIVERY_FROM;

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
              return (
                <div
                  key={it.id}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm bg-slate-800/50 ${
                    recent ? 'animate-field-pop' : ''
                  }`}
                >
                  <span className="text-slate-200">
                    {it.name} <span className="text-slate-500">×{it.qty}</span>
                  </span>
                  <span className="text-white tabular-nums">{formatRub(it.price * it.qty)}</span>
                </div>
              );
            })}
          </div>

          {order.length > 0 && (
            <div className="mt-3 border-t border-slate-700 pt-2 space-y-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Доставка</span>
                <span className={freeDelivery ? 'text-emerald-400' : 'text-slate-200'}>
                  {freeDelivery ? 'бесплатно' : formatRub(200)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-200 font-medium">Итого</span>
                <span className="text-emerald-300 font-bold text-lg tabular-nums">
                  {formatRub(freeDelivery ? total : total + 200)}
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
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
              ★ Бонусы: {bonus}
            </span>
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
                  {rec.items.map((i) => `${i.name}×${i.qty}`).join(', ')}
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
