import { config } from '../config.js';

// Антиспам публичного режима: ограничение числа сессий с одного IP в окне.
// In-memory — достаточно для одного pm2-инстанса. При масштабе → Redis.

interface IpRecord {
  count: number;
  windowStart: number;
}

const ipHits = new Map<string, IpRecord>();

export function checkIpLimit(ip: string): { ok: boolean; retryAfterMin?: number } {
  const windowMs = config.limits.ipWindowMinutes * 60_000;
  const now = Date.now();
  const rec = ipHits.get(ip);

  if (!rec || now - rec.windowStart > windowMs) {
    ipHits.set(ip, { count: 1, windowStart: now });
    return { ok: true };
  }

  if (rec.count >= config.limits.ipMaxSessions) {
    const retryAfterMin = Math.ceil((rec.windowStart + windowMs - now) / 60_000);
    return { ok: false, retryAfterMin };
  }

  rec.count += 1;
  return { ok: true };
}

// Периодическая чистка протухших записей, чтобы карта не росла бесконечно.
setInterval(() => {
  const windowMs = config.limits.ipWindowMinutes * 60_000;
  const now = Date.now();
  for (const [ip, rec] of ipHits) {
    if (now - rec.windowStart > windowMs) ipHits.delete(ip);
  }
}, 5 * 60_000).unref();
