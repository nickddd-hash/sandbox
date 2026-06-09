// Чтение конфигурации из окружения. Один источник правды для остального бэкенда.

// Подхватываем backend/.env в деве. В проде переменные задаёт менеджер процессов (pm2).
try {
  process.loadEnvFile();
} catch {
  /* .env отсутствует — берём переменные окружения как есть */
}

function num(name: string, def: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return def;
  const n = Number(raw);
  return Number.isFinite(n) ? n : def;
}

function str(name: string, def = ''): string {
  return process.env[name] ?? def;
}

export const config = {
  port: num('PORT', 8080),
  frontendOrigin: str('FRONTEND_ORIGIN', 'http://localhost:5173'),
  staticDir: str('STATIC_DIR'),

  dasha: {
    apiKey: str('DASHA_API_KEY'),
    baseUrl: str('DASHA_BASE_URL', 'https://blackbox.dasha.ai'),
    tokenTtlSeconds: num('DASHA_TOKEN_TTL_SECONDS', 900),
    // niche -> integrationId
    integrations: {
      dental: str('DASHA_INTEGRATION_DENTAL'),
      auto: str('DASHA_INTEGRATION_AUTO'),
      meat: str('DASHA_INTEGRATION_MEAT'),
      salon: str('DASHA_INTEGRATION_SALON'),
      food: str('DASHA_INTEGRATION_FOOD'),
      lendauto: str('DASHA_INTEGRATION_LENDAUTO'),

    } as Record<string, string>,
  },

  hubris: {
    apiKey: str('HUBRIS_API_KEY'),
    baseUrl: 'https://api.hubris.pw/v1',
    model: 'google/gemini-2.5-flash',
  },

  voximplant: {
    accountId: str('VOXIMPLANT_ACCOUNT_ID'),
    apiKey: str('VOXIMPLANT_API_KEY'),
    applicationId: str('VOXIMPLANT_APPLICATION_ID', '56201783'),
    callerId: str('VOXIMPLANT_CALLERID'),
    scenarioName: str('VOXIMPLANT_SCENARIO_NAME', 'dasha-bridge-test'),
  },

  limits: {
    sessionMinuteCap: num('SESSION_MINUTE_CAP', 3),
    ipMaxSessions: num('IP_MAX_SESSIONS', 5),
    ipWindowMinutes: num('IP_WINDOW_MINUTES', 60),
    presenterKey: str('PRESENTER_KEY', 'change-me'),
  },

  supabase: {
    url: str('SUPABASE_URL'),
    serviceKey: str('SUPABASE_SERVICE_KEY'),
    leadsTable: str('SUPABASE_LEADS_TABLE', 'sandbox_leads'),
  },
};

// Включён ли реальный Dasha. Без ключа отдаём simulator-режим.
export const dashaEnabled = (): boolean => Boolean(config.dasha.apiKey);

// Настроен ли Voximplant для телефонных callback-звонков.
export const voxEnabled = (): boolean =>
  Boolean(config.voximplant.accountId && config.voximplant.apiKey);

// Настроен ли Supabase для записи лидов.
export const supabaseEnabled = (): boolean =>
  Boolean(config.supabase.url && config.supabase.serviceKey);
