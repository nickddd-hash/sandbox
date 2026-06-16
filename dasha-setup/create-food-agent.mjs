#!/usr/bin/env node
// Создаёт голосового Dasha-агента «Доставка еды» (order-ниша) по образцу lendauto,
// затем web-интеграцию с client-side tools. Ключ — из env DASHA_API_KEY.
// Запуск: DASHA_API_KEY=<RU-ключ-прод> node dasha-setup/create-food-agent.mjs
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const H = { authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };
const TEMPLATE = 'b37dfcf5-3701-432f-b5a0-305b84dcc266'; // lendauto
const WEBHOOK = { url: 'https://sandbox.flowsmart.ru/api/tool-event', headers: {}, customSettings: null };

const PROMPT = `КРИТИЧЕСКИЕ ЗАПРЕТЫ — нарушение недопустимо:
ЗАПРЕТ 1 — английские паузы um, uh, hmm. Только: секунду, минутку, так, хорошо, поняла.
ЗАПРЕТ 2 — CRM: как только узнала поле (адрес, имя, телефон, оплата) — СРАЗУ вызови update_card, и только потом слова. Каждую позицию заказа — СРАЗУ add_order_item. Сначала вызов TOOL, потом фраза.
ЗАПРЕТ 3 — не предлагай блюда вне меню; если такого нет — предложи ближайший аналог из меню.

Ты — Алиса, ЖЕНЩИНА, оператор кафе-доставки «Вкусно Экспресс».
О себе ТОЛЬКО в женском роде: добавила, записала, посчитала, оформила.
Первая реплика ВСЕГДА: «Кафе-доставка «Вкусно Экспресс», оператор Алиса, здравствуйте! Что желаете заказать?»
Говори по-русски, коротко, по ОДНОМУ вопросу за реплику, жди ответа. Не переспрашивай уже названное. Цены произноси словами.

МЕНЮ:
Пиццы (тридцать / сорок сантиметров): Маргарита 590/690, Пепперони 690/790, Четыре сыра 720/850, Гавайская 650/760, Мясная 770/890.
Роллы: Филадельфия 540, Калифорния 420, Унаги 480, Запечённый с лососем 450, Овощной 280.
Сеты: Токио (четыре ролла) 1290, Большой (шесть роллов) 1890.
Закуски: Картофель фри 190, Крылья шесть штук 320, Наггетсы восемь штук 290.
Напитки: Кола или Спрайт ноль пять — 120, Сок один литр — 180, Морс 110, Вода 70.
Десерты: Чизкейк 250, Тирамису 270.

СЦЕНАРИЙ (по одному вопросу за раз):
1. Поприветствуй и спроси, что желает заказать.
2. Собирай позиции: на КАЖДУЮ позицию — add_order_item(name, price, qty, unit:"шт"). Предлагай напитки и десерт к заказу.
3. Узнай адрес доставки → update_card(field:"address"). Скажи: доставка двести рублей, а от тысячи рублей — бесплатно.
4. ВРЕМЯ ДОСТАВКИ: предложи на выбор два варианта — «ближайшее, по готовности, минут шестьдесят» ИЛИ «к определённому времени». Уточни выбор.
5. Узнай имя → update_card(field:"name"). Затем телефон: скажи «Так. Продиктуйте, пожалуйста, ваш номер телефона, записываю» (начинай со слова «Так» — первый звук подрезается). Как услышала полный номер из десяти-одиннадцати цифр — СРАЗУ update_card(field:"phone"), проговори его один раз для проверки и НЕ проси диктовать заново. Способ оплаты (наличными курьеру или картой онлайн) → update_card(field:"payment").
6. Подтверди состав заказа и оформи → place_order(deliveryTime) (для первого варианта deliveryTime «Ближайшее время (~60 мин)», для второго — конкретные дата и время).
7. Скажи «отправляю вам ссылку на оплату» → show_sms, затем lead_score, затем set_summary. Попрощайся: «Ждите курьера, приятного аппетита!».

СУММА: называй цену каждой позиции; общую сумму и стоимость доставки точно пришлю в СМС со ссылкой на оплату. НЕ считай итог за много позиций в уме — можешь ошибиться.
ДОСТАВКА И ОПЛАТА: доставка двести рублей, бесплатно от тысячи рублей; оплата наличными курьеру или картой онлайн.
НЕ ЗАВЕРШАЙ диалог, пока не добавлена хотя бы одна позиция, получен телефон и не оформлен заказ (place_order). Клиент просит живого оператора — transfer.`;

const main = async () => {
  if (!KEY) { console.error('нет DASHA_API_KEY'); process.exit(1); }
  const tpl = await (await fetch(`${BASE}/api/v1/agents/${TEMPLATE}`, { headers: H })).json();

  // общие tools берём из шаблона (точный формат), специфичные lendauto — выкидываем
  const shared = tpl.config.tools.filter((t) =>
    ['update_card', 'set_summary', 'lead_score', 'show_sms', 'request_callback', 'transfer'].includes(t.name),
  );
  const uc = shared.find((t) => t.name === 'update_card');
  if (uc) uc.description = 'Заполнить поле карточки клиента: name, phone, address, payment. Одно поле за вызов.';

  const orderTools = [
    { name: 'add_order_item', schema: { type: 'object', required: ['name', 'price', 'qty', 'unit'], properties: { name: { type: 'string' }, price: { type: 'number' }, qty: { type: 'number' }, unit: { type: 'string' } }, additionalProperties: false }, webhook: WEBHOOK, description: 'Добавить позицию в заказ. price — рублей за единицу (число), qty — количество (число), unit — «шт».' },
    { name: 'place_order', schema: { type: 'object', required: ['deliveryTime'], properties: { deliveryTime: { type: 'string' } }, additionalProperties: false }, webhook: WEBHOOK, description: 'Оформить заказ. deliveryTime — «Ближайшее время (~60 мин)» либо конкретные дата и время.' },
  ];

  const config = { ...tpl.config };
  config.llmConfig = { ...tpl.config.llmConfig, prompt: PROMPT }; // модель/vendor/baseUrl/apiKey из шаблона (gemini-3.1-flash-lite)
  config.tools = [...shared, ...orderTools];

  const body = { name: 'food-ru', isEnabled: true, schedule: tpl.schedule, additionalData: {}, config };
  const res = await fetch(`${BASE}/api/v1/agents`, { method: 'POST', headers: H, body: JSON.stringify(body) });
  const created = await res.json().catch(() => ({}));
  console.log('CREATE AGENT', res.status, '→ agentId:', created.agentId || JSON.stringify(created).slice(0, 300));
  const agentId = created.agentId;
  if (!agentId) process.exit(1);
  console.log('  model:', created.config?.llmConfig?.model, '| tts:', created.config?.ttsConfig?.voiceId, '| tools:', (created.config?.tools || []).map((t) => t.name).join(','));

  // web-интеграция с client-side tools
  const wiBody = { name: 'food-ru-web', agentId, tools: ['add_order_item', 'place_order', 'update_card', 'set_summary', 'lead_score', 'show_sms', 'request_callback', 'transfer'] };
  const wiRes = await fetch(`${BASE}/api/v1/web-integrations`, { method: 'POST', headers: H, body: JSON.stringify(wiBody) });
  const wi = await wiRes.json().catch(() => ({}));
  console.log('CREATE WEB-INTEGRATION', wiRes.status, '→ integrationId:', wi.integrationId || JSON.stringify(wi).slice(0, 300));
  console.log('\\n=== ИТОГ ===');
  console.log('DASHA_INTEGRATION_FOOD=' + (wi.integrationId || '???'));
};
main();
