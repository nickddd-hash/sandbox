import { create } from 'zustand';
import type { NicheConfig, SessionMode, ToolEvent, Transport } from './types';
import { DEFAULT_NICHE, NICHES } from './config/niches';
import { perCall } from './roi';

export type ConnStatus = 'idle' | 'ringing' | 'connecting' | 'live' | 'ended' | 'error';
export type Channel = 'voice' | 'chat';

export interface ChatMessage {
  id: string;
  from: 'agent' | 'user';
  text: string;
}

export interface CardField {
  value: string;
  updatedAt: number; // для анимации подсветки при изменении
}

export interface SmsState {
  text: string;
  link: string;
  at: number;
}

export interface ToolLogEntry {
  id: string;
  name: string;
  args: Record<string, unknown>;
  at: number;
}

export interface PendingCallback {
  reason: string;
  fireAt: number;
}

interface State {
  niche: NicheConfig;
  mode: SessionMode;
  transport: Transport;
  sessionId: string | null;
  channel: Channel;
  status: ConnStatus;

  contact: { name: string; phone: string } | null;
  gateOpen: boolean;

  card: Record<string, CardField>;
  summary: string | null;
  score: number | null;
  sentiment: string | null;

  messages: ChatMessage[];
  sms: SmsState | null;
  transferReason: string | null;
  pendingCallback: PendingCallback | null;

  toolLog: ToolLogEntry[];
  showBehindScenes: boolean;

  savedTotal: number; // накопленная экономия за сессию, ₽

  // actions
  setNiche: (id: string) => void;
  openGate: () => void;
  submitContact: (name: string, phone: string) => void;
  beginSession: (s: { sessionId: string; mode: SessionMode; transport: Transport }) => void;
  setChannel: (c: Channel) => void;
  setStatus: (s: ConnStatus) => void;
  addMessage: (m: Omit<ChatMessage, 'id'>) => void;
  applyTool: (e: ToolEvent) => void;
  toggleBehindScenes: () => void;
  clearCallback: () => void;
  resetConversation: () => void;
}

function emptyCard(): Record<string, CardField> {
  return {};
}

export const useStore = create<State>((set, get) => ({
  niche: DEFAULT_NICHE,
  mode: 'public',
  transport: 'simulator',
  sessionId: null,
  channel: 'voice',
  status: 'idle',

  contact: null,
  gateOpen: false,

  card: emptyCard(),
  summary: null,
  score: null,
  sentiment: null,

  messages: [],
  sms: null,
  transferReason: null,
  pendingCallback: null,

  toolLog: [],
  showBehindScenes: false,

  savedTotal: 0,

  setNiche: (id) => {
    const niche = NICHES[id] ?? DEFAULT_NICHE;
    // Смена ниши обнуляет разговор и карточку.
    set({
      niche,
      card: emptyCard(),
      summary: null,
      score: null,
      sentiment: null,
      messages: [],
      sms: null,
      transferReason: null,
      pendingCallback: null,
      toolLog: [],
      status: 'idle',
      savedTotal: 0,
    });
  },

  openGate: () => set({ gateOpen: true }),

  submitContact: (name, phone) => {
    const now = Date.now();
    // Контакт становится первой карточкой — «оно уже записало меня».
    set((s) => ({
      contact: { name, phone },
      gateOpen: false,
      card: {
        ...s.card,
        name: { value: name, updatedAt: now },
        phone: { value: phone, updatedAt: now },
      },
    }));
  },

  beginSession: ({ sessionId, mode, transport }) =>
    set({ sessionId, mode, transport, status: 'connecting' }),

  setChannel: (channel) => set({ channel }),
  setStatus: (status) => set({ status }),

  addMessage: (m) =>
    set((s) => ({
      messages: [...s.messages, { ...m, id: crypto.randomUUID() }],
    })),

  applyTool: (e) => {
    const now = Date.now();
    const log: ToolLogEntry = { id: e.id, name: e.name, args: e.args, at: now };
    set((s) => ({ toolLog: [...s.toolLog, log] }));

    switch (e.name) {
      case 'update_card': {
        const field = String(e.args.field ?? '');
        const value = String(e.args.value ?? '');
        if (!field) return;
        set((s) => ({ card: { ...s.card, [field]: { value, updatedAt: now } } }));
        return;
      }
      case 'set_summary': {
        set({ summary: String(e.args.text ?? '') });
        return;
      }
      case 'lead_score': {
        set({
          score: typeof e.args.score === 'number' ? e.args.score : null,
          sentiment: e.args.sentiment != null ? String(e.args.sentiment) : null,
        });
        return;
      }
      case 'show_sms': {
        set({
          sms: { text: String(e.args.text ?? ''), link: String(e.args.link ?? ''), at: now },
        });
        return;
      }
      case 'request_callback': {
        const delay = typeof e.args.delaySeconds === 'number' ? e.args.delaySeconds : 10;
        set({
          pendingCallback: {
            reason: String(e.args.reason ?? 'Обратный звонок'),
            fireAt: now + delay * 1000,
          },
        });
        return;
      }
      case 'transfer': {
        set({ transferReason: String(e.args.reason ?? 'Перевод на оператора') });
        return;
      }
      default:
        // неизвестный tool — только в логе «под капотом»
        return;
    }
  },

  toggleBehindScenes: () => set((s) => ({ showBehindScenes: !s.showBehindScenes })),
  clearCallback: () => set({ pendingCallback: null }),

  resetConversation: () => {
    const { niche } = get();
    set({
      card: niche ? {} : {},
      summary: null,
      score: null,
      sentiment: null,
      messages: [],
      sms: null,
      transferReason: null,
      pendingCallback: null,
      toolLog: [],
      status: 'idle',
      savedTotal: 0,
    });
  },
}));

// Накопление экономии: на каждый завершённый разговор (status -> ended) добавляем savedPerCall.
useStore.subscribe((state, prev) => {
  if (state.status === 'ended' && prev.status !== 'ended') {
    const saved = perCall(state.niche.roi).savedPerCall;
    useStore.setState((s) => ({ savedTotal: s.savedTotal + saved }));
  }
});
