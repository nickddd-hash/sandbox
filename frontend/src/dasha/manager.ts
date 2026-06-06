import type { Conversation } from './Conversation';
import type { StartSessionResponse } from '../types';
import { Simulator } from './Simulator';
import { DashaClient } from './DashaClient';
import { NICHES } from '../config/niches';

// Выбор реализации разговора по транспорту сессии.
export function createConversation(session: StartSessionResponse): Conversation {
  if (session.transport === 'dasha' && session.dasha) {
    return new DashaClient(session);
  }
  const niche = NICHES[session.niche] ?? NICHES.dental;
  return new Simulator(niche);
}
