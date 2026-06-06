#!/usr/bin/env node
// Зонд живого websocket Dasha BlackBox: проверяет авторизацию, формат initialize,
// текстовые сообщения и — главное — реальную форму websocketToolRequest/Response,
// чтобы снять TODO в DashaClient (поля SDP/tool).
//
// Запуск (Node 20+ с глобальным WebSocket):
//   node dasha-setup/dasha-ping.mjs <DASHA_API_KEY> [niche]
//
// Использует DEV-эндпоинт с API-ключом (только локально, ключ не светить в браузере).

const apiKey = process.argv[2] || process.env.DASHA_API_KEY;
const niche = process.argv[3] || 'dental';

if (!apiKey) {
  console.error('Укажи API-ключ: node dasha-setup/dasha-ping.mjs <DASHA_API_KEY> [niche]');
  process.exit(1);
}

const url = `wss://blackbox.dasha.ai/api/v1/ws/dev?authorization=${encodeURIComponent(apiKey)}`;
console.log('→ подключаюсь:', url.replace(apiKey, '***'));

const ws = new WebSocket(url);
const send = (o) => {
  console.log('→ отправляю:', o.type);
  ws.send(JSON.stringify(o));
};

ws.addEventListener('open', () => {
  console.log('✓ соединение открыто');
  send({
    type: 'initialize',
    timestamp: new Date().toISOString(),
    request: {
      callType: 'chat',
      additionalData: { sessionId: 'probe', niche, mode: 'presenter' },
    },
  });
  // Через 1.5с шлём пользовательскую реплику, провоцируя диалог и tool-вызовы.
  setTimeout(() => {
    send({
      type: 'incomingChatMessage',
      timestamp: new Date().toISOString(),
      content: { text: 'Здравствуйте! Хочу записаться на чистку зубов, меня зовут Игорь.' },
    });
  }, 1500);
});

ws.addEventListener('message', (ev) => {
  let msg;
  try {
    msg = JSON.parse(ev.data);
  } catch {
    console.log('← (не JSON):', ev.data);
    return;
  }
  console.log('←', msg.type, JSON.stringify(msg, null, 2));

  // Автоответ на tool-запрос, чтобы диалог продолжался и мы увидели всю цепочку.
  if (msg.type === 'websocketToolRequest') {
    const id = msg.content?.id;
    send({
      type: 'websocketToolResponse',
      timestamp: new Date().toISOString(),
      content: { id, result: { success: true } },
    });
  }
});

ws.addEventListener('error', (e) => console.error('✗ ошибка ws:', e.message ?? e));
ws.addEventListener('close', (e) => {
  console.log('✗ закрыто:', e.code, e.reason);
  process.exit(0);
});

// Закрываемся через 20 секунд.
setTimeout(() => {
  console.log('— таймаут, закрываю');
  ws.close();
}, 20000);
