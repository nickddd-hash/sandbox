#!/usr/bin/env node
// Тест интеграции с Bitrix24 через Node (UTF-8) — проверяем, что кириллица привязывается.
// Вебхук берём из backend/.env (BITRIX_WEBHOOK_URL).
process.loadEnvFile('backend/.env');
const B = (process.env.BITRIX_WEBHOOK_URL || '').replace(/\/$/, '');
if (!B) { console.error('нет BITRIX_WEBHOOK_URL в backend/.env'); process.exit(1); }

const call = (method, payload) =>
  fetch(`${B}/${method}.json`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  }).then((r) => r.json());

const add = await call('crm.lead.add', {
  fields: {
    TITLE: 'ИИ-песочница: прокат авто',
    NAME: 'Иван',
    LAST_NAME: 'Тестов',
    PHONE: [{ VALUE: '+79991234567', VALUE_TYPE: 'WORK' }],
    COMMENTS: 'Запрос: Kia Rio, 20–25 июня. Лид из демо sandbox.flowsmart.ru',
    SOURCE_DESCRIPTION: 'Sales Sandbox (ИИ-консультант)',
  },
});
console.log('crm.lead.add →', JSON.stringify(add.result ?? add));
const id = add.result;
if (!id) process.exit(1);

const got = await call('crm.lead.get', { id });
const f = got.result || {};
console.log('Проверка полей лида', id + ':');
console.log('  TITLE      :', f.TITLE);
console.log('  NAME       :', f.NAME, f.LAST_NAME);
console.log('  PHONE      :', f.PHONE?.[0]?.VALUE);
console.log('  COMMENTS   :', f.COMMENTS);
console.log('  SOURCE_DESC:', f.SOURCE_DESCRIPTION);
