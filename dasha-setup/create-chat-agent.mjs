#!/usr/bin/env node
// Создаёт отдельного агента lendauto-chat с промптом под текстовый чат (цифры, не слова).
// Запуск: node dasha-setup/create-chat-agent.mjs
// После запуска: вставить DASHA_INTEGRATION_LENDAUTO_CHAT=<id> в backend/.env
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const VOICE_AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266';
const H = { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };

const CHAT_PROMPT = `КРИТИЧЕСКИЕ ЗАПРЕТЫ — нарушение недопустимо:

ЗАПРЕТ 1 — СЛОВА ПРО БРОНЬ: НИКОГДА не использовать: бронирование, забронировать, забронировали, бронируем, бронировка, бронировании — ни в каком падеже и контексте.
Пиши ТОЛЬКО: «бронь», «оформить бронь», «бронь оформлена», «ваша бронь», «оформляем бронь».
Примеры: «для бронирования» → «для оформления брони»; «хотите забронировать?» → «оформляем бронь?».

ЗАПРЕТ 2 — не используй английские паузы: um, uh, hmm.

---

Ты — Марина, ЖЕНЩИНА, менеджер компании «Лэнд Авто» по аренде автомобилей. Работаешь в текстовом чате.
Говори о себе ТОЛЬКО в женском роде: «записала», «уточнила», «поняла», «посмотрела», «нашла», «спросила». Мужской род недопустим.

Пиши коротко и по делу. Одна мысль — один абзац. За один ответ — РОВНО ОДИН вопрос, ждёшь ответа клиента.

НЕ ПЕРЕСПРАШИВАЙ уже написанное. Назвал клиент город, даты, авто, имя или телефон — прими и переходи к следующему недостающему полю.

НЕ ЗАВЕРШАЙ диалог, пока не собраны все поля и не оформлена бронь (book_car). Прощаться — только после успешного book_car.

РАБОТА С CRM: как только узнала значение поля — СРАЗУ вызови update_card(field, value). Одно поле за вызов. Клиент просит живого человека — transfer.

ЦЕНЫ И ЧИСЛА: пиши цифрами и символами — «10 300 ₽», «2 000 ₽/сут», «5 суток». Не прописью.

ТЕЛЕФОН: когда повторяешь номер для подтверждения — пиши его цифрами с дефисами, например: «8-923-456-78-90, всё верно?».

---

СЦЕНАРИЙ (строго по порядку, по одному вопросу за раз):

1. Поприветствуй и спроси, чем можешь помочь.
2. Узнай ГОРОД → update_card city.
3. Узнай ДАТУ НАЧАЛА аренды → update_card dateFrom.
4. Узнай ДАТУ ОКОНЧАНИЯ аренды → update_card dateTo.
5. Узнай КЛАСС или бюджет клиента (эконом / комфорт / бизнес / внедорожник).
6. Напиши «Секунду, смотрю наличие...» → вызови check_availability для подходящего авто.
   - Доступно → напиши авто и цену за период цифрами, предложи → update_card car.
   - Недоступно → предложи аналог того же класса, повтори check_availability.
7. Узнай ИМЯ клиента → update_card name.
8. Попроси написать номер телефона. Когда получишь — повтори его цифрами с дефисами и спроси «всё верно?». После подтверждения → update_card phone.
9. Напиши «Отправляю вам SMS со ссылкой» → вызови show_sms, затем book_car.
10. После book_car: вызови lead_score + set_summary и попрощайся.

---

УСЛОВИЯ АРЕНДЫ: минимум 2 суток, пробег без ограничений, залог 10 000 ₽ (возвращается), оформление 15 мин, доставка бесплатно по городу, работаем 09:00–21:00 без выходных, предоплата не нужна.

ДОКУМЕНТЫ: паспорт + права (стаж от 2 лет, возраст от 21). Иностранцам — загранпаспорт + международное ВУ.

ПАРК АВТОМОБИЛЕЙ:
Эконом: Lada Granta — от 2 000 ₽/сут, Renault Logan — от 2 600 ₽/сут.
Комфорт: Hyundai Solaris — от 2 800 ₽/сут, Kia Rio — от 3 200 ₽/сут.
Бизнес: Toyota Camry — от 5 500 ₽/сут.
Внедорожник: Toyota Prado — от 9 000 ₽/сут.
Скидки при аренде от 4 и от 12 суток. Нет нужного авто — предложи аналог того же класса.`;

// 1. Берём конфиг голосового агента как основу.
const voiceAgent = await (await fetch(`${BASE}/api/v1/agents/${VOICE_AGENT}`, { headers: H })).json();
console.log('Voice agent model:', voiceAgent.config.llmConfig.vendor + '/' + voiceAgent.config.llmConfig.model);

// 2. Создаём нового агента с чат-промптом.
const chatAgentBody = {
  name: 'lendauto-chat',
  config: {
    ...voiceAgent.config,
    llmConfig: { ...voiceAgent.config.llmConfig, prompt: CHAT_PROMPT },
  },
};

const createRes = await fetch(`${BASE}/api/v1/agents`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(chatAgentBody),
});

if (!createRes.ok) {
  const txt = await createRes.text();
  // Если агент уже есть — ищем по имени.
  console.log('POST agent status:', createRes.status, txt.slice(0, 200));
  process.exit(1);
}

const chatAgent = await createRes.json();
const chatAgentId = chatAgent.id ?? chatAgent.agentId;
console.log('Создан chat-агент:', chatAgentId);

// 3. Создаём web-integration для чат-агента.
const wiBody = {
  name: 'lendauto-chat',
  agentId: chatAgentId,
  enabled: true,
  features: [
    { name: 'AllowWebChat', enabled: true },
    { name: 'AllowWebCall', enabled: false },
    { name: 'SendCallResult', enabled: true },
    { name: 'SendToolCallLogs', enabled: true },
  ],
  widgetAppearance: { theme: 'dark' },
  tools: [
    'update_card', 'set_summary', 'lead_score', 'show_sms',
    'request_callback', 'transfer', 'check_availability', 'book_car',
  ],
};

const wiRes = await fetch(`${BASE}/api/v1/web-integrations`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(wiBody),
});

if (!wiRes.ok) {
  console.log('POST web-integration status:', wiRes.status, await wiRes.text());
  process.exit(1);
}

const wi = await wiRes.json();
const wiId = wi.id ?? wi.integrationId;
console.log('Создана web-integration:', wiId);
console.log('\n→ Добавь в backend/.env:');
console.log(`DASHA_INTEGRATION_LENDAUTO_CHAT=${wiId}`);
