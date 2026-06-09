#!/usr/bin/env node
// Тест текстового чата по нише через наш бэкенд /api/chat.
//   node dasha-setup/chat-test.mjs [niche]
const niche = process.argv[2] || 'meat';
const post = (body) => fetch('http://localhost:8080/api/chat', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}).then((r) => r.json());

const show = (r) => {
  console.log('  Ольга:', r.reply);
  if (r.toolCalls?.length) console.log('   🔧', r.toolCalls.map((t) => t.name + ' ' + JSON.stringify(t.args)).join(' | '));
};

const hist = [];
let r = await post({ history: [], niche });
show(r); hist.push({ role: 'assistant', content: r.reply });

const turns = [
  'Нужно филе грудки 10 кг и заготовка для шаурмы из курицы 15 кг',
  'Ресторан «Прайм», Москва, улица Тверская 5',
  'Завтра к 10 утра',
  'Андрей, 8 900 111 22 33',
  'Да, оформляйте',
];
for (const t of turns) {
  console.log('\n→', t);
  r = await post({ message: t, history: hist, niche });
  show(r);
  hist.push({ role: 'user', content: t }, { role: 'assistant', content: r.reply });
}
