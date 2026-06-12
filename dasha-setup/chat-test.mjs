#!/usr/bin/env node
// Тест текстового чата по нише через наш бэкенд /api/chat.
//   node dasha-setup/chat-test.mjs [niche]
const niche = process.argv[2] || 'meat';
const URL = process.env.CHAT_URL || 'http://localhost:8080/api/chat';
const post = (body) => fetch(URL, {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
}).then((r) => r.json());

const show = (r) => {
  console.log('  ИИ:', r.reply);
  if (r.toolCalls?.length) console.log('   🔧', r.toolCalls.map((t) => t.name + ' ' + JSON.stringify(t.args)).join(' | '));
};

const hist = [];
let r = await post({ history: [], niche });
show(r); hist.push({ role: 'assistant', content: r.reply });

const TURNS = {
  meat: [
    'Нужно филе грудки 10 кг и заготовка для шаурмы из курицы 15 кг',
    'Ресторан «Прайм», Москва, улица Тверская 5',
    'Завтра к 10 утра, наличными',
    'Ахмед',
    '+7+255555555',
    '+7 999 111 22 33',
    'Да, оформляйте',
  ],
  dental: [
    'Хочу записаться на консультацию, болит зуб',
    'Вася',
    'Давайте завтра в 10 утра',
    'да',
    '+7 926 555 55 55',
  ],
  salon: [
    'Хочу стрижку и окрашивание',
    'Марина',
    'Можно завтра вечером',
    'да',
    '+7 926 555 55 55',
  ],
  flowers: [
    'Хочу букет из жёлтых роз на день рождения',
    'тогда давайте 25 красных роз',
    'улица Пушкина 12, квартира 5',
    'сегодня к 17:00',
    'Олег',
    '+7 903 123 45 67',
    'да, оформляйте',
  ],
};
const turns = TURNS[niche] || TURNS.meat;
for (const t of turns) {
  console.log('\n→', t);
  r = await post({ message: t, history: hist, niche });
  show(r);
  hist.push({ role: 'user', content: t }, { role: 'assistant', content: r.reply });
}
