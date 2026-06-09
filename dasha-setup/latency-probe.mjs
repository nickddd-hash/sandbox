#!/usr/bin/env node
// Замер задержек агента lendauto в chat-режиме (изолирует LLM+tools от WebRTC).
// Меряет: время до первого токена ответа на реплику + round-trip каждого тула.
// Выводит inspectorUrl (из jobId) для потактовой раскладки в дашборде Dasha.
const s = await (await fetch('http://localhost:8080/api/session/start', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ niche: 'lendauto', presenterKey: 'change-me' }),
})).json();
if (!s.dasha) { console.error('НЕТ dasha (simulator?) — стоп'); process.exit(1); }
const ws = new WebSocket(s.dasha.wsUrl);
const send = (o) => ws.send(JSON.stringify(o));

const firstTokenMs = [];     // задержки до первого токена ответа
const toolRtMs = [];         // round-trip тулзов (наш ответ → toolCallResult)
const pendingTool = [];      // очередь времён отправки ответа на тул
let userSentAt = 0, awaitingFirst = false, buf = '', timer = null, jobId = null;

const answerFor = (t) => {
  t = t.toLowerCase();
  if (/имя|обращат|зовут/.test(t)) return 'Игорь Петров.';
  if (/город/.test(t)) return 'Москва.';
  if (/класс|бюджет|авто|машин|подобрать|эконом|комфорт/.test(t)) return 'Комфорт, Kia Rio.';
  if (/начал|с какого|дата.*начал|когда.*начин/.test(t)) return 'С десятого июня.';
  if (/оконч|до какого|возврат|по какое|дата.*оконч/.test(t)) return 'По четырнадцатое июня.';
  if (/дат|когда|срок|период/.test(t)) return 'С десятого по четырнадцатое июня.';
  if (/телефон|номер/.test(t)) return 'Девять девять девять один два три четыре пять шесть семь.';
  if (/верно|подтverd|правильно/.test(t)) return 'Да, верно.';
  if (/подтверд|оформ|готов|брон/.test(t)) return 'Да, оформляйте.';
  return 'Да.';
};
const sendUser = (text) => { userSentAt = Date.now(); awaitingFirst = true; console.log('  →', text); send({ type: 'incomingChatMessage', timestamp: new Date().toISOString(), content: text }); };
const replyMaybe = () => { const t = buf.trim(); buf = ''; if (!/[?]|назовите|скажите|подскажите|продиктуйте/i.test(t)) return; sendUser(answerFor(t)); };

ws.addEventListener('open', () => {
  send({ type: 'initialize', timestamp: new Date().toISOString(), request: { callType: 'chat', additionalData: { sessionId: s.sessionId, niche: 'lendauto', mode: 'presenter' } } });
  setTimeout(() => sendUser('Здравствуйте, хочу арендовать машину.'), 1000);
});
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.type === 'event' && m.name === 'connection') { jobId = m.data?.jobId; console.log('jobId:', jobId, '\ninspector:', `https://playground.ru.dasha.ai/inspector/${jobId}\n`); }
  if (m.type === 'text' && m.content?.source === 'assistant' && m.content?.text) {
    const txt = m.content.text;
    if (awaitingFirst) { const d = Date.now() - userSentAt; firstTokenMs.push(d); awaitingFirst = false; console.log(`  ← [${d} мс до 1-го токена] ${txt}`); }
    else console.log('  ←', txt);
    buf += ' ' + txt; clearTimeout(timer); timer = setTimeout(replyMaybe, 1500);
  }
  if (m.type === 'websocketToolRequest') {
    send({ type: 'websocketToolResponse', timestamp: new Date().toISOString(), channelId: null, content: { id: m.content?.id, result: { success: true } } });
    pendingTool.push({ name: m.content?.toolName, at: Date.now() });
    console.log('  🔧', m.content?.toolName);
  }
  if (m.type === 'toolCallResult') { const p = pendingTool.shift(); if (p) toolRtMs.push(Date.now() - p.at); }
});
const summary = () => {
  const avg = (a) => a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0;
  console.log('\n===== ИТОГ =====');
  console.log(`Реплик: ${firstTokenMs.length} | задержка до 1-го токена: avg ${avg(firstTokenMs)} мс, max ${Math.max(0, ...firstTokenMs)} мс`);
  console.log(`Тулзов: ${toolRtMs.length} | round-trip тула: avg ${avg(toolRtMs)} мс, max ${Math.max(0, ...toolRtMs)} мс`);
  if (jobId) console.log('inspector:', `https://playground.ru.dasha.ai/inspector/${jobId}`);
};
ws.addEventListener('close', () => { summary(); process.exit(0); });
setTimeout(() => { summary(); ws.close(); }, 50000);
