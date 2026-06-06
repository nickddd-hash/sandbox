import { config, supabaseEnabled } from '../config.js';
import type { LeadPayload } from '../types.js';

// Запись лида публичного режима в Supabase через REST (PostgREST).
// Без настроенного Supabase — no-op (лид просто логируется).

export async function saveLead(lead: LeadPayload): Promise<{ stored: boolean }> {
  if (!supabaseEnabled()) {
    console.log('[lead] Supabase не настроен, лид не сохранён:', lead);
    return { stored: false };
  }

  const url = `${config.supabase.url}/rest/v1/${config.supabase.leadsTable}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.supabase.serviceKey,
      authorization: `Bearer ${config.supabase.serviceKey}`,
      prefer: 'return=minimal',
    },
    body: JSON.stringify({
      session_id: lead.sessionId,
      niche: lead.niche,
      name: lead.name ?? null,
      phone: lead.phone ?? null,
      summary: lead.summary ?? null,
      score: lead.score ?? null,
      sentiment: lead.sentiment ?? null,
      created_at: new Date().toISOString(),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase insert failed: ${res.status} ${text}`);
  }
  return { stored: true };
}
