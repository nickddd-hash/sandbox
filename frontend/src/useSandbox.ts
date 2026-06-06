import { useCallback, useEffect, useRef } from 'react';
import { useStore } from './store';
import { startSession, postLead } from './api';
import { createConversation } from './dasha/manager';
import type { Conversation } from './dasha/Conversation';
import type { Channel } from './store';

// Презентер-ключ из URL (?presenter=KEY) — снимает лимиты на бэке.
function presenterKey(): string | undefined {
  const k = new URLSearchParams(window.location.search).get('presenter');
  return k ?? undefined;
}

export function useSandbox() {
  const convRef = useRef<Conversation | null>(null);

  const launch = useCallback(async (channel: Channel) => {
    const s = useStore.getState();

    // Глушим предыдущий разговор, если он ещё жив — исключаем двойные/осиротевшие звонки.
    if (convRef.current) {
      convRef.current.stop();
      convRef.current = null;
    }

    s.setChannel(channel);

    // Публичный режим без контакта — сперва гейт (контакт = первый лид).
    if (s.mode === 'public' && !s.contact && !presenterKey()) {
      s.openGate();
      return;
    }

    s.resetConversation();
    // Контакт переносим обратно в карточку после reset.
    if (s.contact) {
      s.submitContact(s.contact.name, s.contact.phone);
    }

    try {
      const session = await startSession(s.niche.id, presenterKey());
      // Канал выбирается на фронте: голос → webCall (WebRTC), текст → chat (без аудио).
      if (session.dasha) {
        session.dasha.callType = channel === 'chat' ? 'chat' : 'webCall';
      }
      s.beginSession({
        sessionId: session.sessionId,
        mode: session.mode,
        transport: session.transport,
      });
      convRef.current = createConversation(session);
      await convRef.current.start();
    } catch (err) {
      console.error('Не удалось запустить разговор:', err);
      useStore.getState().setStatus('error');
    }
  }, []);

  const stop = useCallback(() => {
    convRef.current?.stop();
    convRef.current = null;
  }, []);

  const sendText = useCallback((text: string) => {
    convRef.current?.sendUserText(text);
  }, []);

  // По завершении разговора — отправляем лид (публичный режим).
  useEffect(() => {
    const unsub = useStore.subscribe((state, prev) => {
      if (state.status === 'ended' && prev.status !== 'ended' && state.sessionId) {
        if (state.mode === 'public') {
          void postLead({
            sessionId: state.sessionId,
            niche: state.niche.id,
            name: state.card.name?.value,
            phone: state.card.phone?.value ?? state.contact?.phone,
            summary: state.summary ?? undefined,
            score: state.score ?? undefined,
            sentiment: state.sentiment ?? undefined,
          });
        }
      }
    });
    return unsub;
  }, []);

  return { launch, stop, sendText };
}
