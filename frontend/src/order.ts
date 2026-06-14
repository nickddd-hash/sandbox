import type { OrderItem } from './store';

// Единый расчёт суммы заказа и доставки (источник истины UI).
// Используется и в OrderBoard (отображение), и при создании платежа ЮKassa.
export const FREE_KG = 15;
export const FREE_RUB = 1000;
export const FLAT_DELIVERY = 200;

export function orderTotals(order: OrderItem[], nicheId: string) {
  const isWeight = nicheId === 'meat'; // мясо — доставка по весу
  const total = order.reduce((sum, it) => sum + it.price * it.qty, 0);
  const weightKg = order.reduce(
    (sum, it) => sum + ((it.unit || '').toLowerCase().startsWith('кг') ? it.qty : 0),
    0,
  );
  const freeDelivery = isWeight ? weightKg >= FREE_KG : total >= FREE_RUB;
  const grandTotal = isWeight ? total : total + (freeDelivery ? 0 : FLAT_DELIVERY);
  return { isWeight, total, weightKg, freeDelivery, grandTotal };
}
