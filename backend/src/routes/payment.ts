import type { FastifyInstance } from 'fastify';
import { createPayment } from '../services/yookassa.js';
import { yookassaEnabled } from '../config.js';

// Создаёт платёж в ЮKassa под сумму заказа и возвращает ссылку на оплату.
export async function paymentRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/payment', async (req, reply) => {
    const b = (req.body ?? {}) as { amount?: number; description?: string };
    const amount = typeof b.amount === 'number' ? Math.round(b.amount * 100) / 100 : 0;
    if (!(amount > 0)) return reply.code(400).send({ error: 'invalid_amount' });
    if (!yookassaEnabled()) return reply.code(503).send({ error: 'yookassa_not_configured' });

    const description =
      typeof b.description === 'string' && b.description.trim()
        ? b.description.trim()
        : 'Оплата заказа';

    try {
      const url = await createPayment({ amount, description });
      return reply.send({ url });
    } catch (err) {
      req.log.error({ err }, 'ЮKassa: не удалось создать платёж');
      return reply.code(502).send({ error: 'payment_failed' });
    }
  });
}
