import type { Niche, StartSessionResponse } from './types';

export async function startSession(
  niche: Niche,
  presenterKey?: string,
): Promise<StartSessionResponse> {
  const res = await fetch('/api/session/start', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ niche, presenterKey }),
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

export async function sendChatMessage(
  message: string | undefined,
  history: { role: 'user' | 'assistant'; content: string }[],
  niche: Niche,
): Promise<{ reply: string; toolCalls: { id: string; name: string; args: Record<string, unknown> }[] }> {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ message, history, niche }),
  });
  if (!res.ok) throw new Error(`chat_${res.status}`);
  return res.json();
}

export async function createPayment(
  amount: number,
  description: string,
): Promise<{ url: string | null; id?: string }> {
  const res = await fetch('/api/payment', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ amount, description }),
  });
  if (!res.ok) throw new Error(`payment_${res.status}`);
  return res.json();
}

export async function getPaymentStatus(id: string): Promise<{ status: string | null }> {
  const res = await fetch(`/api/payment/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`payment_status_${res.status}`);
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
