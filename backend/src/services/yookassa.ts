import { randomUUID } from 'node:crypto';
import { config, yookassaEnabled } from '../config.js';

// Создание платежа в ЮKassa (REST API v3). Возвращает ссылку на оплату (confirmation_url).
// Без ключей — null (демо-режим).

interface CreatePaymentArgs {
  amount: number; // сумма в рублях
  description: string;
}

export async function createPayment({ amount, description }: CreatePaymentArgs): Promise<string | null> {
  if (!yookassaEnabled()) {
    console.log('[yookassa] ключи не настроены, платёж не создан');
    return null;
  }
  if (!(amount > 0)) return null;

  const auth = Buffer.from(`${config.yookassa.shopId}:${config.yookassa.secretKey}`).toString('base64');
  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      authorization: `Basic ${auth}`,
      'Idempotence-Key': randomUUID(),
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      capture: true,
      confirmation: { type: 'redirect', return_url: config.yookassa.returnUrl },
      description: description.slice(0, 128),
    }),
  });

  const data = (await res.json().catch(() => ({}))) as {
    confirmation?: { confirmation_url?: string };
    description?: string;
    type?: string;
  };
  if (!res.ok || !data.confirmation?.confirmation_url) {
    throw new Error(`ЮKassa payment failed: ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data.confirmation.confirmation_url;
}
