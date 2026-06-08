#!/usr/bin/env node
// Адаптивный chat-зонд: отвечает по смыслу вопроса агента (а не по таймеру),
// чтобы проверить, что новый промпт доводит сценарий до конца (book_car) и спрашивает по одному.
const s = await (await fetch('http://localhost:8080/api/session/start', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ niche: 'lendauto', presenterKey: 'change-me' }),
})).json();
const ws = new WebSocket(s.dasha.wsUrl);
const send = (o) => ws.send(JSON.stringify(o));

let buf = '';
let timer = null;
const answerFor = (t) => {
  t = t.toLowerCase();
  if (/имя|обращат|записать|зовут/.test(t)) return 'Игорь Петров.';
  if (/город/.test(t)) return 'Москва.';
  if (/авто|машин|модел|подобрать/.test(t)) return 'Kia Rio.';
  if (/дат|когда|срок|число|период|сутк/.test(t)) return 'С 10 по 14 июня.';
  if (/телефон|номер|ссылк|смс|sms/.test(t)) return 'Девять девять девять, один два три, сорок пять, шестьдесят семь.';
  if (/подтверд|бронир|оформ|готов/.test(t)) return 'Да, бронируйте.';
  return 'Да.';
};
const replyMaybe = () => {
  const text = buf.trim(); buf = '';
  if (!text.includes('?') && !/назовите|скажите|подскажите/i.test(text)) return; // ждём вопрос
  const ans = answerFor(text);
  console.log('  → user:', ans);
  send({ type: 'incomingChatMessage', timestamp: new Date().toISOString(), content: ans });
};

ws.addEventListener('open', () => {
  send({ type: 'initialize', timestamp: new Date().toISOString(), request: { callType: 'chat', additionalData: { sessionId: s.sessionId, niche: 'lendauto', mode: 'presenter' } } });
  setTimeout(() => { console.log('  → user: Здравствуйте, хочу арендовать машину.'); send({ type: 'incomingChatMessage', timestamp: new Date().toISOString(), content: 'Здравствуйте, хочу арендовать машину.' }); }, 1200);
});
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.type === 'text' && m.content?.source === 'assistant' && m.content?.text) {
    const t = m.content.text;
    if (t.trim() === 'um') return;
    console.log('  ← Марина:', t);
    buf += ' ' + t;
    clearTimeout(timer); timer = setTimeout(replyMaybe, 1600);
    return;
  }
  if (m.type === 'websocketToolRequest') {
    const tn = m.content?.toolName;
    console.log('🔧 tool:', tn, JSON.stringify(m.content?.args));
    send({ type: 'websocketToolResponse', timestamp: new Date().toISOString(), channelId: null, content: { id: m.content?.id, result: { success: true } } });
    return;
  }
  if (m.type === 'error') console.log('❌ ERROR:', m.data?.message);
  if (m.type === 'conversationResult') console.log('🏁 RESULT:', m.result?.status);
});
ws.addEventListener('close', () => process.exit(0));
setTimeout(() => ws.close(), 45000);
