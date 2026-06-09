import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { config, dashaEnabled } from '../config.js';
import { isNiche } from '../types.js';
import type { SessionMode, StartSessionResponse } from '../types.js';
import { checkIpLimit } from '../services/limitGuard.js';
import {
  integrationIdForNiche,
  mintIntegrationToken,
  wsUrlForToken,
} from '../services/dashaTokens.js';

export async function sessionRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/session/start', async (req, reply) => {
    const body = (req.body ?? {}) as { niche?: unknown; presenterKey?: unknown; channel?: unknown };

    if (!isNiche(body.niche)) {
      return reply.code(400).send({ error: 'invalid_niche' });
    }
    const niche = body.niche;

    const mode: SessionMode =
      typeof body.presenterKey === 'string' && body.presenterKey === config.limits.presenterKey
        ? 'presenter'
        : 'public';

    // Лимиты — только в публичном режиме.
    if (mode === 'public') {
      const ip = req.ip;
      const limit = checkIpLimit(ip);
      if (!limit.ok) {
        return reply
          .code(429)
          .send({ error: 'rate_limited', retryAfterMin: limit.retryAfterMin });
      }
    }

    const sessionId = randomUUID();
    const minuteCap =
      mode === 'presenter' ? 0 /* без лимита */ : config.limits.sessionMinuteCap;

    const base: StartSessionResponse = {
      sessionId,
      mode,
      niche,
      transport: 'simulator',
      minuteCap,
    };

    // Без ключа Dasha — отдаём simulator (фронт проигрывает сценарий локально).
    if (!dashaEnabled()) {
      return reply.send(base);
    }

    const channel = body.channel === 'chat' ? 'chat' : 'voice';
    const nicheKey = channel === 'chat' ? `${niche}-chat` : niche;
    const integrationId = integrationIdForNiche(nicheKey) ?? integrationIdForNiche(niche);
    if (!integrationId) {
      req.log.warn({ niche }, 'нет integrationId для ниши — fallback на simulator');
      return reply.send(base);
    }

    try {
      const token = await mintIntegrationToken(integrationId);
      const resp: StartSessionResponse = {
        ...base,
        transport: 'dasha',
        dasha: {
          wsUrl: wsUrlForToken(token),
          token,
          integrationId,
          callType: 'webCall',
        },
      };
      return reply.send(resp);
    } catch (err) {
      req.log.error({ err }, 'минт токена Dasha не удался — fallback на simulator');
      return reply.send(base);
    }
  });
}
