import type { Conversation } from './Conversation';
import { useStore } from '../store';
import type { StartSessionResponse } from '../types';

// Реальный клиент к websocket Dasha BlackBox.
// Контракт (по докам): wss .../ws/webCall?token=… ; initialize → {callType, additionalData};
// сервер шлёт text / sdpInvite / websocketToolRequest / conversationResult;
// клиент отвечает incomingChatMessage / sdpAnswer / websocketToolResponse.
//
// ВНИМАНИЕ: точные поля WebRTC/SDP-сообщений нужно подтвердить на живом аккаунте Dasha —
// помечено TODO. Структура обмена и tool/chat-путь соответствуют документации.

interface ServerMessage {
  type: string;
  timestamp?: string;
  content?: any;
  text?: string;
  request?: any;
  data?: any;
}

export class DashaClient implements Conversation {
  private ws: WebSocket | null = null;
  private pc: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private session: StartSessionResponse;

  constructor(session: StartSessionResponse) {
    this.session = session;
  }

  async start(): Promise<void> {
    const dasha = this.session.dasha;
    if (!dasha) throw new Error('DashaClient: нет данных подключения в сессии');

    const store = useStore.getState();
    store.setStatus('connecting');

    this.ws = new WebSocket(dasha.wsUrl);

    this.ws.onopen = () => {
      this.send({
        type: 'initialize',
        timestamp: new Date().toISOString(),
        request: {
          callType: dasha.callType, // 'webCall' (голос) | 'chat'
          additionalData: {
            sessionId: this.session.sessionId,
            niche: this.session.niche,
            mode: this.session.mode,
          },
        },
      });
    };

    this.ws.onmessage = (ev) => this.onMessage(ev);
    this.ws.onerror = (e) => {
      console.error('[DashaClient] ws error:', e);
      useStore.getState().setStatus('error');
    };
    this.ws.onclose = (e) => {
      console.warn('[DashaClient] ws closed:', e.code, e.reason);
      const s = useStore.getState();
      if (s.status === 'live' || s.status === 'connecting') s.setStatus('ended');
    };
  }

  private onMessage(ev: MessageEvent): void {
    let msg: ServerMessage;
    try {
      msg = JSON.parse(ev.data as string);
    } catch {
      return;
    }
    const store = useStore.getState();

    switch (msg.type) {
      case 'ready':
      case 'started':
        store.setStatus('live');
        break;

      case 'text': {
        // Голосовой режим — без транскрипта (внимание на CRM).
        if (this.session.dasha?.callType === 'webCall') break;
        const c = msg.content;
        // Реальный формат: content = { source: 'assistant'|'user', text, ... }.
        // Показываем только реплики ассистента; пользовательские эхо добавляем локально.
        const text = typeof c === 'string' ? c : c?.text;
        if (text && (c?.source ?? 'assistant') === 'assistant') {
          store.addMessage({ from: 'agent', text });
        }
        break;
      }

      case 'sdpInvite':
        void this.handleSdpInvite(msg);
        break;

      case 'websocketToolRequest': {
        const c = msg.content ?? {};
        store.applyTool({ id: c.id, name: c.toolName, args: c.args ?? {} });
        // channelId обязателен (nullable) — слать явно null, иначе сервер закрывает соединение (1007).
        this.send({
          type: 'websocketToolResponse',
          timestamp: new Date().toISOString(),
          channelId: null,
          content: { id: c.id, result: { success: true } },
        });
        break;
      }

      case 'conversationResult': {
        const summary = msg.content?.summary ?? msg.content?.transcript?.summary;
        if (summary) store.applyTool({ id: crypto.randomUUID(), name: 'set_summary', args: { text: summary } });
        store.setStatus('ended');
        break;
      }

      default:
        break;
    }
  }

  // WebRTC: принимаем offer (data.invite), отдаём answer (data.sdpAnswer), играем входящий звук.
  private async handleSdpInvite(msg: ServerMessage): Promise<void> {
    try {
      const invite: string | undefined = msg.data?.invite;
      if (!invite) throw new Error('sdpInvite без data.invite');

      this.pc = new RTCPeerConnection();

      this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const track of this.localStream.getTracks()) {
        this.pc.addTrack(track, this.localStream);
      }

      this.pc.ontrack = (e) => {
        if (!this.audioEl) {
          this.audioEl = document.createElement('audio');
          this.audioEl.autoplay = true;
          document.body.appendChild(this.audioEl);
        }
        this.audioEl.srcObject = e.streams[0];
      };

      await this.pc.setRemoteDescription({ type: 'offer', sdp: invite });
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);

      // Offer без trickle ICE → дожидаемся сбора кандидатов и шлём полный SDP.
      await this.waitIceGathering();

      this.send({
        type: 'sdpAnswer',
        timestamp: new Date().toISOString(),
        channelId: null,
        data: { sdpAnswer: this.pc.localDescription?.sdp ?? answer.sdp },
      });

      useStore.getState().setStatus('live');
    } catch (err) {
      console.error('[DashaClient] sdpInvite/WebRTC ошибка:', err);
      useStore.getState().setStatus('error');
    }
  }

  // Ждём окончания сбора ICE-кандидатов (с таймаутом, чтобы не зависнуть).
  private waitIceGathering(timeoutMs = 2500): Promise<void> {
    const pc = this.pc;
    if (!pc || pc.iceGatheringState === 'complete') return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => {
        pc.removeEventListener('icegatheringstatechange', onChange);
        resolve();
      };
      const onChange = () => {
        if (pc.iceGatheringState === 'complete') done();
      };
      pc.addEventListener('icegatheringstatechange', onChange);
      setTimeout(done, timeoutMs);
    });
  }

  sendUserText(text: string): void {
    // content — строка (объект {text} сервер отвергает с 1007).
    this.send({
      type: 'incomingChatMessage',
      timestamp: new Date().toISOString(),
      content: text,
    });
    useStore.getState().addMessage({ from: 'user', text });
  }

  private send(obj: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  stop(): void {
    this.localStream?.getTracks().forEach((t) => t.stop());
    this.pc?.close();
    this.ws?.close();
    this.audioEl?.remove();
    this.ws = null;
    this.pc = null;
    this.localStream = null;
    this.audioEl = null;
  }
}
