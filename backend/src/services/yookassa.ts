import { randomUUID } from 'node:crypto';
import { config, yookassaEnabled } from '../config.js';

// Работа с ЮKassa (REST API v3). Без ключей — null (демо-режим).

interface CreatePaymentArgs {
  amount: number; // сумма в рублях
  description: string;
}

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${config.yookassa.shopId}:${config.yookassa.secretKey}`).toString('base64');
}

// Создаёт платёж и возвращает его id + ссылку на оплату (confirmation_url).
export async function createPayment({ amount, description }: CreatePaymentArgs): Promise<{ id: string; url: string } | null> {
  if (!yookassaEnabled()) {
    console.log('[yookassa] ключи не настроены, платёж не создан');
    return null;
  }
  if (!(amount > 0)) return null;

  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      authorization: authHeader(),
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
    id?: string;
    confirmation?: { confirmation_url?: string };
  };
  if (!res.ok || !data.id || !data.confirmation?.confirmation_url) {
    throw new Error(`ЮKassa payment failed: ${res.status} ${JSON.stringify(data).slice(0, 300)}`);
  }
  return { id: data.id, url: data.confirmation.confirmation_url };
}

// Возвращает статус платежа: pending | waiting_for_capture | succeeded | canceled.
export async function getPaymentStatus(id: string): Promise<string | null> {
  if (!yookassaEnabled()) return null;
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(id)}`, {
    headers: { authorization: authHeader() },
  });
  const data = (await res.json().catch(() => ({}))) as { status?: string };
  if (!res.ok || !data.status) return null;
  return data.status;
}
