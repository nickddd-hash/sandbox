import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { voxEnabled } from '../config.js';
import { startCallback } from '../services/voximplant.js';
import { isNiche } from '../types.js';

export async function callbackRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/callback', async (req, reply) => {
    const body = (req.body ?? {}) as { phone?: unknown; niche?: unknown };

    const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
    const niche = isNiche(body.niche) ? body.niche : 'salon';

    if (!phone) return reply.code(400).send({ error: 'phone_required' });
    if (!voxEnabled()) return reply.code(503).send({ error: 'telephony_not_configured' });

    const sessionId = randomUUID();

    try {
      await startCallback(phone, sessionId, niche);
      return reply.send({ ok: true, sessionId });
    } catch (err) {
      app.log.error({ err }, 'startCallback failed');
      return reply.code(502).send({ error: 'callback_failed' });
    }
  });
}
