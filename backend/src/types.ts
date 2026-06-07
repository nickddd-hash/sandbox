export type Niche = 'dental' | 'auto' | 'meat' | 'salon' | 'food';
export const NICHES: Niche[] = ['dental', 'auto', 'meat', 'salon', 'food'];

export function isNiche(v: unknown): v is Niche {
  return typeof v === 'string' && (NICHES as string[]).includes(v);
}

export type SessionMode = 'public' | 'presenter';

export interface StartSessionRequest {
  niche: Niche;
  presenterKey?: string;
}

export interface StartSessionResponse {
  sessionId: string;
  mode: SessionMode;
  niche: Niche;
  // 'dasha' — открывать websocket Dasha; 'simulator' — гонять локальный сценарий.
  transport: 'dasha' | 'simulator';
  minuteCap: number;
  // Заполнено только при transport === 'dasha'.
  dasha?: {
    wsUrl: string;
    token: string;
    integrationId: string;
    callType: 'webCall' | 'chat';
  };
}

export interface LeadPayload {
  sessionId: string;
  niche: Niche;
  name?: string;
  phone?: string;
  summary?: string;
  score?: number;
  sentiment?: string;
}
