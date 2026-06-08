#!/usr/bin/env node
// Многоходовый chat-зонд: гонит диалог до tool-вызовов и логирует
// формат websocketToolRequest + реакцию сервера на наш websocketToolResponse.
const lines = [
  'Здравствуйте! Хочу арендовать машину. Меня зовут Игорь.',
  'Я в Москве.',
  'Хочу Kia Rio.',
  'С 10 по 14 июня.',
  'Мой телефон 9991234567.',
  'Да, бронируйте.',
];
let i = 0;

const s = await (await fetch('http://localhost:8080/api/session/start', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ niche: 'lendauto', presenterKey: 'change-me' }),
})).json();
const ws = new WebSocket(s.dasha.wsUrl);
const send = (o) => ws.send(JSON.stringify(o));
const sendUser = () => {
  if (i >= lines.length) return;
  const text = lines[i++];
  console.log('  → user:', text);
  send({ type: 'incomingChatMessage', timestamp: new Date().toISOString(), content: text });
};

ws.addEventListener('open', () => {
  console.log('✓ ws открыт');
  send({ type: 'initialize', timestamp: new Date().toISOString(), request: { callType: 'chat', additionalData: { sessionId: s.sessionId, niche: 'lendauto', mode: 'presenter' } } });
  setTimeout(sendUser, 1500);
  // дальше — по таймеру каждые 4с (диалог асинхронный)
  setInterval(sendUser, 4000);
});

ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.type === 'event') { console.log('· event', m.name); return; }
  if (m.type === 'text') {
    const c = m.content;
    if (c?.source === 'assistant' && c?.text) console.log('  ← assistant:', c.text);
    return;
  }
  if (m.type === 'websocketToolRequest') {
    console.log('🔧 TOOL REQ (полностью):', JSON.stringify(m));
    send({ type: 'websocketToolResponse', timestamp: new Date().toISOString(), channelId: null, content: { id: m.content?.id, result: { success: true } } });
    console.log('   ↳ ответил websocketToolResponse {channelId:null, content:{id,result}}');
    return;
  }
  if (m.type === 'error') { console.log('❌ ERROR:', m.data?.message); return; }
  if (m.type === 'conversationResult') { console.log('🏁 RESULT:', m.result?.status, '|', m.result?.errorMessage ?? '—'); return; }
  console.log('←', m.type, JSON.stringify(m).slice(0, 160));
});
ws.addEventListener('close', (e) => { console.log('✗ CLOSE code=', e.code, 'reason=', JSON.stringify(e.reason)); process.exit(0); });
setTimeout(() => ws.close(), 30000);
