import type { StartSessionResponse } from '../types';

// Единый интерфейс разговора: и симулятор, и реальный Dasha-клиент реализуют его.
// Компоненты UI не знают, кто за ним стоит.
export interface Conversation {
  start(): Promise<void> | void;
  sendUserText(text: string): void; // текстовый канал
  stop(): void;
}

export type ConversationFactory = (session: StartSessionResponse) => Conversation;
