import type { FastifyInstance } from 'fastify';
import { isNiche } from '../types.js';
import type { LeadPayload } from '../types.js';
import { saveLead } from '../services/supabase.js';
import { pushLead } from '../services/bitrix.js';

export async function leadRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/lead', async (req, reply) => {
    const b = (req.body ?? {}) as Partial<LeadPayload>;

    if (typeof b.sessionId !== 'string' || !isNiche(b.niche)) {
      return reply.code(400).send({ error: 'invalid_lead' });
    }

    const lead: LeadPayload = {
      sessionId: b.sessionId,
      niche: b.niche,
      name: typeof b.name === 'string' ? b.name.slice(0, 200) : undefined,
      phone: typeof b.phone === 'string' ? b.phone.slice(0, 50) : undefined,
      summary: typeof b.summary === 'string' ? b.summary.slice(0, 4000) : undefined,
      score: typeof b.score === 'number' ? b.score : undefined,
      sentiment: typeof b.sentiment === 'string' ? b.sentiment.slice(0, 50) : undefined,
    };

    // Отправка в Bitrix24 — best-effort: не должна ронять запрос.
    pushLead(lead).catch((err) => req.log.error({ err }, 'Bitrix: не удалось создать лид'));

    try {
      const result = await saveLead(lead);
      return reply.send({ ok: true, stored: result.stored });
    } catch (err) {
      req.log.error({ err }, 'не удалось сохранить лид');
      return reply.code(502).send({ error: 'lead_store_failed' });
    }
  });
}
