import type { FastifyInstance } from 'fastify';
import { createPayment, getPaymentStatus } from '../services/yookassa.js';
import { yookassaEnabled } from '../config.js';

// Создаёт платёж в ЮKassa под сумму заказа и возвращает ссылку на оплату + id.
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
      const payment = await createPayment({ amount, description });
      return reply.send(payment ?? { url: null });
    } catch (err) {
      req.log.error({ err }, 'ЮKassa: не удалось создать платёж');
      return reply.code(502).send({ error: 'payment_failed' });
    }
  });

  // Статус платежа (фронт опрашивает, чтобы показать «оплачено»).
  app.get('/api/payment/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    if (!id) return reply.code(400).send({ error: 'invalid_id' });
    if (!yookassaEnabled()) return reply.code(503).send({ error: 'yookassa_not_configured' });
    try {
      const status = await getPaymentStatus(id);
      return reply.send({ status });
    } catch (err) {
      req.log.error({ err }, 'ЮKassa: не удалось получить статус платежа');
      return reply.code(502).send({ error: 'status_failed' });
    }
  });
}
