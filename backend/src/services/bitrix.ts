import { config, bitrixEnabled } from '../config.js';
import type { LeadPayload } from '../types.js';

// Отправка лида в Bitrix24 CRM через входящий вебхук (crm.lead.add).
// ВАЖНО: тело шлём JSON (UTF-8) — кириллица привязывается корректно.
// Без настроенного вебхука — no-op.

interface BitrixLeadFields {
  TITLE: string;
  NAME?: string;
  LAST_NAME?: string;
  PHONE?: { VALUE: string; VALUE_TYPE: string }[];
  COMMENTS?: string;
  SOURCE_DESCRIPTION?: string;
  OPPORTUNITY?: number; // сумма (бюджет/чек), необязательно
}

async function call<T = unknown>(method: string, payload: unknown): Promise<T> {
  const base = config.bitrix.webhookUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/${method}.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = (await res.json().catch(() => ({}))) as { result?: T; error?: string; error_description?: string };
  if (!res.ok || data.error) {
    throw new Error(`Bitrix ${method} failed: ${res.status} ${data.error_description ?? data.error ?? ''}`);
  }
  return data.result as T;
}

// Разбивает «Иван Тестов» → { name, lastName }. Один токен → только NAME.
function splitName(full?: string): { NAME?: string; LAST_NAME?: string } {
  const parts = (full ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { NAME: parts[0] };
  return { NAME: parts[0], LAST_NAME: parts.slice(1).join(' ') };
}

const NICHE_TITLE: Record<string, string> = {
  lendauto: 'Прокат авто',
  meat: 'Оптовый заказ мяса',
  flowers: 'Заказ цветов',
  realty: 'Недвижимость',
  salon: 'Запись в салон',
  food: 'Заказ еды',
  dental: 'Запись к стоматологу',
  auto: 'Автосервис',
};

// Создаёт лид в Bitrix24 из payload песочницы. Возвращает id лида (или null, если выключено).
export async function pushLead(lead: LeadPayload): Promise<number | null> {
  if (!bitrixEnabled()) {
    console.log('[bitrix] вебхук не настроен, лид не отправлен:', lead.sessionId);
    return null;
  }

  const title = `ИИ-консультант: ${NICHE_TITLE[lead.niche] ?? lead.niche}`;
  const fields: BitrixLeadFields = {
    TITLE: title,
    SOURCE_DESCRIPTION: 'Sales Sandbox (ИИ-консультант)',
    ...splitName(lead.name),
  };
  if (lead.phone) fields.PHONE = [{ VALUE: lead.phone, VALUE_TYPE: 'WORK' }];
  if (lead.summary) fields.COMMENTS = lead.summary;

  const id = await call<number>('crm.lead.add', { fields });
  console.log(`[bitrix] лид создан #${id} (${title})`);
  return id;
}
