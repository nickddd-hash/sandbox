export type Niche = 'dental' | 'auto' | 'meat' | 'salon';

export type SessionMode = 'public' | 'presenter';
export type Transport = 'dasha' | 'simulator';

export interface StartSessionResponse {
  sessionId: string;
  mode: SessionMode;
  niche: Niche;
  transport: Transport;
  minuteCap: number;
  dasha?: {
    wsUrl: string;
    token: string;
    integrationId: string;
    callType: 'webCall' | 'chat';
  };
}

// Описание поля карточки CRM конкретной ниши.
export interface FieldDef {
  key: string;
  label: string;
}

// Параметры для расчёта экономики (ROI) по нише.
export interface RoiParams {
  aiCostPerCall: number; // ₽ за обработку обращения ИИ
  humanCostPerCall: number; // ₽ за то же время живого менеджера
  missedCallValue: number; // ₽ — ценность одного необработанного обращения
  defaultCallsPerDay: number; // дефолт для калькулятора
  defaultManagerSalary: number; // ₽/мес — дефолт для калькулятора
}

// Реплика скриптованного сценария (для симулятора).
export interface ScriptStep {
  at: number; // мс от старта разговора
  // Либо реплика в чат, либо вызов tool — то же, что прислал бы Dasha.
  say?: { from: 'agent' | 'user'; text: string };
  tool?: { name: string; args: Record<string, unknown> };
}

export interface NicheConfig {
  id: Niche;
  label: string;
  emoji: string;
  agentName: string;
  fields: FieldDef[];
  roi: RoiParams;
  script: ScriptStep[];
}

// Унифицированное tool-событие (и от Dasha, и от симулятора).
export interface ToolEvent {
  id: string;
  name: string;
  args: Record<string, unknown>;
}
