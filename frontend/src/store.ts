import { create } from 'zustand';
import type { NicheConfig, SessionMode, ToolEvent, Transport } from './types';
import { DEFAULT_NICHE, NICHES } from './config/niches';

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

export interface Appointment {
  id: string;
  day: string; // как назвал агент: «четверг» | «чт» | «сегодня» | «завтра» | дата
  time: string; // «18:00»
  service: string;
  client?: string;
  master?: string;
  at: number; // для анимации появления
}

export interface RentalBooking {
  id: string;
  car: string;
  dateFrom: string;
  dateTo: string;
  client: string;
  city?: string;
  at: number; // для анимации
  available?: boolean; // результат check_availability
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  unit?: string; // 'кг' | 'шт' и т.п. (по умолчанию 'шт')
  at: number;
}

// Запись истории заказов (для карточки клиента / бонусной программы).
export interface OrderRecord {
  id: string;
  placedAt: number;
  items: { name: string; qty: number; price: number; unit?: string }[];
  total: number;
  deliveryTime?: string;
}

// Данные осмотра недвижимости — для демо-страницы (карточка объекта + детали визита).
export interface ViewingInfo {
  service: string;
  date: string;
  realtor: string;
  client: string;
  phone: string;
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
  appointments: Appointment[];
  order: OrderItem[];
  orderHistory: OrderRecord[];
  bonusPoints: number;
  rentals: RentalBooking[];
  lastAvailabilityCheck: { car: string; available: boolean } | null;
  viewing: ViewingInfo | null;
  viewingOpen: boolean;
  paid: boolean; // заказ оплачен онлайн (после успешной оплаты ЮKassa)

  toolLog: ToolLogEntry[];
  showBehindScenes: boolean;
  lastCallSec: number | null;

  // actions

  setNiche: (id: string) => void;
  setViewing: (v: ViewingInfo) => void;
  openViewing: () => void;
  closeViewing: () => void;
  setPaid: () => void;
  openGate: () => void;
  submitContact: (name: string, phone: string) => void;
  beginSession: (s: { sessionId: string; mode: SessionMode; transport: Transport }) => void;
  setChannel: (c: Channel) => void;
  setStatus: (s: ConnStatus) => void;
  setLastCallSec: (sec: number) => void;
  addMessage: (m: Omit<ChatMessage, 'id'>, separate?: boolean) => void;
  applyTool: (e: ToolEvent) => void;
  toggleBehindScenes: () => void;
  clearCallback: () => void;
  resetConversation: () => void;
}

function emptyCard(): Record<string, CardField> {
  return {};
}

// Конвертирует относительные даты («завтра», «пятница», «послезавтра») в ДД.ММ.ГГГГ.
// Если значение уже содержит реальную дату — возвращает как есть.
function resolveDate(value: string): string {
  if (/\d{2}\.\d{2}\.\d{4}/.test(value)) return value; // уже ДД.ММ.ГГГГ
  const lower = value.toLowerCase().trim();
  const timeMatch = value.match(/(\d{1,2})[:\.](\d{2})/);
  const timeSuffix = timeMatch ? ` ${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}` : '';

  const now = new Date();
  const todayDow = now.getDay(); // 0=Вс
  let target: Date | null = null;

  if (lower.includes('послезавтра')) {
    target = new Date(now.getTime() + 2 * 864e5);
  } else if (lower.includes('завтра')) {
    target = new Date(now.getTime() + 864e5);
  } else if (lower.includes('сегодня')) {
    target = new Date(now);
  } else {
    const map: [string, number][] = [
      ['понедельник', 1], ['пн', 1],
      ['вторник', 2], ['вт', 2],
      ['среду', 3], ['среда', 3], ['ср', 3],
      ['четверг', 4], ['чт', 4],
      ['пятниц', 5], ['пт', 5],
      ['суббот', 6], ['сб', 6],
      ['воскрес', 0], ['вс', 0],
    ];
    for (const [name, dow] of map) {
      if (lower.includes(name)) {
        const diff = ((dow - todayDow + 7) % 7) || 7; // ближайший такой день, минимум завтра
        target = new Date(now.getTime() + diff * 864e5);
        break;
      }
    }
  }

  if (!target) return value;
  const dateStr = target.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${dateStr}${timeSuffix}`;
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
  appointments: [],
  order: [],
  orderHistory: [],
  bonusPoints: 0,
  rentals: [],
  lastAvailabilityCheck: null,
  viewing: null,
  viewingOpen: false,
  paid: false,

  toolLog: [],
  showBehindScenes: false,
  lastCallSec: null,

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
      appointments: [],
      order: [],
      orderHistory: [],
      bonusPoints: 0,
      rentals: [],
      lastAvailabilityCheck: null,
      viewing: null,
      viewingOpen: false,
      paid: false,
      toolLog: [],
      status: 'idle',
    });
  },

  setViewing: (v) => set({ viewing: v }),
  openViewing: () => set({ viewingOpen: true }),
  closeViewing: () => set({ viewingOpen: false }),
  setPaid: () => set({ paid: true }),

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

  addMessage: (m, separate) =>
    set((s) => {
      // Агент шлёт каждую фразу отдельным сообщением (для TTS). В чате склеиваем
      // подряд идущие реплики ассистента в один пузырь, чтобы не было «рваного» вида.
      // separate=true — служебные сообщения (ссылка, «оплата получена») отдельным пузырём.
      const last = s.messages[s.messages.length - 1];
      if (!separate && m.from === 'agent' && last && last.from === 'agent') {
        const merged = { ...last, text: `${last.text} ${m.text}`.trim() };
        return { messages: [...s.messages.slice(0, -1), merged] };
      }
      return { messages: [...s.messages, { ...m, id: crypto.randomUUID() }] };
    }),

  applyTool: (e) => {
    const now = Date.now();
    const log: ToolLogEntry = { id: e.id, name: e.name, args: e.args, at: now };
    set((s) => ({ toolLog: [...s.toolLog, log] }));

    switch (e.name) {
      case 'update_card': {
        const field = String(e.args.field ?? '');
        let value = String(e.args.value ?? '');
        if (!field) return;
        if (field === 'date') value = resolveDate(value);
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
      case 'book_appointment': {
        const appt: Appointment = {
          id: e.id,
          day: String(e.args.day ?? ''),
          time: String(e.args.time ?? ''),
          service: String(e.args.service ?? ''),
          client: e.args.client != null ? String(e.args.client) : undefined,
          master: e.args.master != null ? String(e.args.master) : undefined,
          at: now,
        };
        set((s) => {
          // Защита от дублей: агент иногда вызывает tool повторно.
          const dup = s.appointments.some(
            (x) =>
              x.day === appt.day &&
              x.time === appt.time &&
              x.service === appt.service &&
              (x.client ?? '') === (appt.client ?? ''),
          );
          if (dup) return {};
          // Синхронизируем карточку только если update_card ещё не записал поле
          // (update_card — источник истины; он вызывается до book_appointment по сценарию).
          const card: Record<string, CardField> = { ...s.card };
          if (!s.card.date?.value) card.date = { value: resolveDate(`${appt.day} ${appt.time}`.trim()), updatedAt: now };
          if (appt.master && !s.card.master?.value) card.master = { value: appt.master, updatedAt: now };
          if (appt.service && !s.card.service?.value) card.service = { value: appt.service, updatedAt: now };
          if (appt.client && !s.card.name?.value) card.name = { value: appt.client, updatedAt: now };
          return { appointments: [...s.appointments, appt], card };
        });
        return;
      }
      case 'check_availability': {
        const car = String(e.args.car ?? '');
        // Для демо: если авто уже забронировано в текущей сессии — недоступно, иначе — свободно.
        const alreadyBooked = get().rentals.some((r) => r.car === car);
        set({ lastAvailabilityCheck: { car, available: !alreadyBooked } });
        return;
      }
      case 'book_car': {
        const booking: RentalBooking = {
          id: e.id,
          car: String(e.args.car ?? ''),
          dateFrom: String(e.args.dateFrom ?? ''),
          dateTo: String(e.args.dateTo ?? ''),
          client: String(e.args.client ?? ''),
          city: e.args.city != null ? String(e.args.city) : undefined,
          at: now,
        };
        set((s) => {
          if (s.rentals.some((r) => r.car === booking.car && r.dateFrom === booking.dateFrom)) return {};
          return { rentals: [...s.rentals, booking] };
        });
        return;
      }
      case 'add_order_item': {
        const item: OrderItem = {
          id: e.id,
          name: String(e.args.name ?? ''),
          price: Number(e.args.price) || 0,
          qty: Number(e.args.qty) || 1,
          unit: e.args.unit != null && String(e.args.unit).trim() ? String(e.args.unit).trim() : undefined,
          at: now,
        };
        set((s) => {
          // Защита от дублей повторного вызова tool по одной позиции
          // (модель может переслать ту же позицию с другим регистром/пробелами).
          const norm = (n: string) => n.trim().toLowerCase();
          if (s.order.some((x) => norm(x.name) === norm(item.name))) return {};
          return { order: [...s.order, item] };
        });
        return;
      }
      case 'place_order': {
        set((s) => {
          if (s.order.length === 0) return {};
          const total = s.order.reduce((sum, it) => sum + it.price * it.qty, 0);
          const record: OrderRecord = {
            id: e.id,
            placedAt: now,
            items: s.order.map((it) => ({ name: it.name, qty: it.qty, price: it.price, unit: it.unit })),
            total,
            deliveryTime: e.args.deliveryTime != null ? String(e.args.deliveryTime) : undefined,
          };
          // Бонусная программа: 5% кэшбэк баллами.
          const bonus = Math.round(total * 0.05);
          return {
            orderHistory: [...s.orderHistory, record],
            bonusPoints: s.bonusPoints + bonus,
          };
        });
        return;
      }
      default:
        // неизвестный tool — только в логе «под капотом»
        return;
    }
  },

  toggleBehindScenes: () => set((s) => ({ showBehindScenes: !s.showBehindScenes })),
  setLastCallSec: (sec) => set({ lastCallSec: sec }),
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
      appointments: [],
      order: [],
      orderHistory: [],
      bonusPoints: 0,
      rentals: [],
      lastAvailabilityCheck: null,
      viewing: null,
      viewingOpen: false,
      paid: false,
      toolLog: [],
      status: 'idle',
    });
  },
}));

