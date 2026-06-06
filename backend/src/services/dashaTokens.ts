import { config } from '../config.js';
import type { Niche } from '../types.js';

// Минт короткоживущего web-integration токена Dasha.
// API-ключ остаётся на сервере; браузер получает только короткоживущий токен.
// Контракт: POST {baseUrl}/api/v1/web-integrations/{integrationId}/tokens

export function integrationIdForNiche(niche: Niche): string | undefined {
  const id = config.dasha.integrations[niche];
  return id || undefined;
}

export function wsUrlForToken(token: string): string {
  const base = config.dasha.baseUrl.replace(/^http/, 'ws');
  return `${base}/api/v1/ws/webCall?token=${encodeURIComponent(token)}`;
}

export async function mintIntegrationToken(integrationId: string): Promise<string> {
  const url = `${config.dasha.baseUrl}/api/v1/web-integrations/${integrationId}/tokens`;
  const expiresAt = new Date(Date.now() + config.dasha.tokenTtlSeconds * 1000).toISOString();

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      // Dasha ожидает API-ключ в авторизации; уточнить точную схему в дашборде.
      authorization: `Bearer ${config.dasha.apiKey}`,
    },
    body: JSON.stringify({ name: `sandbox-${Date.now()}`, expiresAt }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Dasha token mint failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { token?: string };
  if (!data.token) throw new Error('Dasha token mint: no token in response');
  return data.token;
}
