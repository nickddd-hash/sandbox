import type { Niche, StartSessionResponse } from './types';

export async function startSession(
  niche: Niche,
  presenterKey?: string,
  channel?: string,
): Promise<StartSessionResponse> {
  const res = await fetch('/api/session/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ niche, presenterKey, channel }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `session_start_${res.status}`);
  }
  return res.json();
}

export async function startCallback(phone: string, niche: string): Promise<{ sessionId: string }> {
  const res = await fetch('/api/callback', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ phone, niche }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `callback_${res.status}`);
  }
  return res.json();
}

export async function postLead(payload: {
  sessionId: string;
  niche: Niche;
  name?: string;
  phone?: string;
  summary?: string;
  score?: number;
  sentiment?: string;
}): Promise<void> {
  await fetch('/api/lead', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
