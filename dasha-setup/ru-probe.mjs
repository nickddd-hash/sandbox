#!/usr/bin/env node
// Свежий зонд RU-платформы: берёт реальный wsUrl+токен из нашего бэка (/api/session/start),
// повторяет initialize как фронт и логирует ВСЕ сообщения + код/причину close.
//   node dasha-setup/ru-probe.mjs [chat|webCall] [niche]
const callType = process.argv[2] || 'chat';
const niche = process.argv[3] || 'lendauto';

const r = await fetch('http://localhost:8080/api/session/start', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ niche, presenterKey: 'change-me' }),
});
const s = await r.json();
console.log('session:', { transport: s.transport, callType, integrationId: s.dasha?.integrationId });
if (!s.dasha) { console.error('НЕТ dasha — fallback simulator, стоп'); process.exit(1); }

const ws = new WebSocket(s.dasha.wsUrl);
const send = (o) => { console.log('→', o.type); ws.send(JSON.stringify(o)); };

ws.addEventListener('open', () => {
  console.log('✓ ws открыт');
  send({
    type: 'initialize',
    timestamp: new Date().toISOString(),
    request: { callType, additionalData: { sessionId: s.sessionId, niche, mode: 'presenter' } },
  });
  if (callType === 'chat') {
    setTimeout(() => send({
      type: 'incomingChatMessage',
      timestamp: new Date().toISOString(),
      content: 'Здравствуйте! Хочу арендовать машину, меня зовут Игорь.',
    }), 1500);
  }
});

ws.addEventListener('message', (ev) => {
  let msg; try { msg = JSON.parse(ev.data); } catch { console.log('← (не JSON):', String(ev.data).slice(0, 200)); return; }
  if (msg.type === 'sdpInvite') {
    const env = { ...msg, data: { ...msg.data, invite: (msg.data?.invite ?? '').slice(0, 60) + `…[${msg.data?.invite?.length} симв.]` } };
    console.log('← sdpInvite ENVELOPE:', JSON.stringify(env, null, 2));
    console.log('--- SDP offer (полностью) ---\n' + msg.data?.invite);
  } else {
    console.log('←', msg.type, 'channelId=' + JSON.stringify(msg.channelId), JSON.stringify(msg).slice(0, 200));
  }
  if (msg.type === 'websocketToolRequest') {
    send({ type: 'websocketToolResponse', timestamp: new Date().toISOString(), channelId: null, content: { id: msg.content?.id, result: { success: true } } });
  }
});

ws.addEventListener('error', (e) => console.error('✗ ws error:', e.message ?? e));
ws.addEventListener('close', (e) => { console.log('✗ CLOSE code=', e.code, 'reason=', JSON.stringify(e.reason)); process.exit(0); });
setTimeout(() => { console.log('— таймаут 15с, закрываю'); ws.close(); }, 15000);
