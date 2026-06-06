import type { Conversation } from './Conversation';
import { useStore } from '../store';
import type { NicheConfig } from '../types';

// Симулятор: проигрывает скриптованный сценарий ниши, эмитя те же реплики и tool-события,
// что прислал бы реальный агент Dasha. Позволяет демонстрировать весь цикл без облака.

export class Simulator implements Conversation {
  private timers: ReturnType<typeof setTimeout>[] = [];
  private niche: NicheConfig;

  constructor(niche: NicheConfig) {
    this.niche = niche;
  }

  start(): void {
    const store = useStore.getState();
    store.setStatus('connecting');

    // Имитация дозвона/подключения, затем «live».
    this.timers.push(
      setTimeout(() => useStore.getState().setStatus('live'), 400),
    );

    const lastAt = this.niche.script.reduce((m, s) => Math.max(m, s.at), 0);

    for (const step of this.niche.script) {
      this.timers.push(
        setTimeout(() => {
          const s = useStore.getState();
          if (step.say) s.addMessage(step.say);
          if (step.tool) {
            s.applyTool({
              id: crypto.randomUUID(),
              name: step.tool.name,
              args: step.tool.args,
            });
          }
        }, step.at),
      );
    }

    // Завершение разговора после последней реплики.
    this.timers.push(
      setTimeout(() => useStore.getState().setStatus('ended'), lastAt + 1200),
    );
  }

  // В симуляторе пользовательский ввод не влияет на сценарий — просто эхо в чат.
  sendUserText(text: string): void {
    useStore.getState().addMessage({ from: 'user', text });
  }

  stop(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
    const s = useStore.getState();
    if (s.status === 'live' || s.status === 'connecting') s.setStatus('ended');
  }
}
