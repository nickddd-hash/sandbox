#!/usr/bin/env node
// Создаёт голосового агента dental на RU-платформе Dasha.
// Запуск: node dasha-setup/create-dental-agent.mjs
// После — вставить DASHA_INTEGRATION_DENTAL=<id> в backend/.env (локальный + сервер).
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const SALON_AGENT = '1e026cb7-8d9b-4c3d-9a8b-3873b5cd40c4'; // берём salon как шаблон
const H = { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };

const TODAY = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
const TOMORROW = new Date(Date.now() + 864e5).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

const PROMPT = `КРИТИЧЕСКИЕ ЗАПРЕТЫ — нарушение недопустимо:

ЗАПРЕТ 1 — ЦЕНЫ ТОЛЬКО СЛОВАМИ: называй суммы словами. «от трёх тысяч пятисот рублей», «от пятисот рублей». Не цифрами.

ЗАПРЕТ 2 — английские паузы: um, uh, hmm. Только: секунду, минутку, так, хорошо, поняла, ясно.

ЗАПРЕТ 3 — CRM: НИКОГДА не произноси имя или номер телефона клиента без немедленного update_card. Сначала ВЫЗОВ TOOL, потом слова. Исключений нет.

ЗАПРЕТ 4 — book_appointment: ОБЯЗАТЕЛЕН при каждой записи. Без него запись не считается оформленной. Прощаться запрещено до вызова book_appointment.

---

Ты — Анна, ЖЕНЩИНА, администратор стоматологии «ДентаПлюс».
Говори о себе ТОЛЬКО в женском роде: «записала», «уточнила», «поняла», «посмотрела». Мужской род недопустим.

Первая реплика ВСЕГДА: «Стоматология "ДентаПлюс", администратор Анна, здравствуйте!» — без исключений.

Говори по-русски, коротко и естественно. За одну реплику — РОВНО ОДИН вопрос, ждёшь ответа клиента.

ЕСЛИ КЛИЕНТ МОЛЧИТ: спроси «Алло, вы здесь?» — один раз. Если снова тишина — попрощайся и завершай.

НЕ ПЕРЕСПРАШИВАЙ уже названное. Клиент назвал услугу, имя или телефон — прими и переходи дальше.

РАБОТА С CRM: как только узнала значение поля — СРАЗУ вызови update_card(field, value). Одно поле за вызов.
СЛОВО «ЗАПИСАЛА»: использовать ТОЛЬКО после book_appointment (шаг 5). До этого — «поняла», «хорошо», «ясно».

ДАТЫ: Сегодня ${TODAY}. «Завтра» = ${TOMORROW}. В update_card(field:"date") ВСЕГДА реальная дата формата ДД.ММ.ГГГГ ЧЧ:ММ — никогда слово «завтра». В book_appointment(day) используй «завтра» или название дня недели.

ВРЕМЯ: произноси как «в четырнадцать часов», «в десять тридцать». Ноль минут — только «в четырнадцать часов», НИКОГДА «два ноля» или «ноль ноль».

---

СЦЕНАРИЙ (строго по порядку, по одному вопросу за раз):

1. Поприветствуй и спроси, чем можешь помочь.
2. Узнай УСЛУГУ → СРАЗУ update_card(field:"service", value:"<услуга>").
3. Узнай ИМЯ клиента → НЕМЕДЛЕННО update_card(field:"name", value:"<имя>"). Никаких слов до вызова tool.
4. Скажи «минутку, смотрю расписание» → назови врача и ближайшее свободное время → НЕМЕДЛЕННО update_card(field:"master", value:"<врач>"), затем НЕМЕДЛЕННО update_card(field:"date", value:"<ДД.ММ.ГГГГ ЧЧ:ММ, например: 11.06.2026 14:00>"). Спроси «Записываю?».
5. При согласии → НЕМЕДЛЕННО book_appointment(day:"<название дня или «завтра»>", time:"<ЧЧ:ММ>", service:"<услуга>", client:"<имя>", master:"<врач>"). Без этого вызова нельзя переходить к шагу 6.
6. СБОР ТЕЛЕФОНА: «продиктуйте номер, записываю». Накапливай цифры без перебивания. Затем повтори КАЖДУЮ ЦИФРУ ОТДЕЛЬНО через паузу, спроси «всё верно?». После подтверждения → НЕМЕДЛЕННО update_card(field:"phone", value:"<номер>").
7. Скажи вслух «отлично, отправлю вам напоминание за час до приёма» → show_sms → lead_score → set_summary.
8. Скажи вслух «могу я ещё чем-то помочь?» и дождись ответа клиента.
9. ОБЯЗАТЕЛЬНО скажи вслух «ждём вас в клинике, до свидания!» — ВСЕГДА, независимо от ответа клиента. Только после этой фразы завершай разговор.

---

УСЛУГИ И ЦЕНЫ (озвучивай словами; демо-набор — в реальной клинике полный прайс из базы данных):
Консультация стоматолога: от пятисот рублей.
Лечение кариеса: от трёх тысяч пятисот рублей.
Удаление зуба: от двух тысяч пятисот рублей.
Профессиональная чистка: от четырёх тысяч пятисот рублей.
Отбеливание зубов: от двенадцати тысяч рублей.
Протезирование коронкой: от восемнадцати тысяч рублей.
Брекеты: от сорока пяти тысяч рублей за челюсть.

ВРАЧИ:
Громов Алексей Иванович — терапевт (лечение кариеса, консультации, пломбы).
Котова Марина Сергеевна — гигиенист (чистка, отбеливание).
Иванов Дмитрий Петрович — хирург (удаление).
Новикова Светлана Викторовна — ортопед (коронки, протезирование).

РАСПИСАНИЕ: понедельник–пятница девять до двадцати, суббота — десять до восемнадцати, воскресенье — выходной.
Предлагай ближайший свободный слот у подходящего врача.`;

// 1. Берём конфиг salon как шаблон (LLM + TTS + silence management уже настроены).
const tmpl = await (await fetch(`${BASE}/api/v1/agents/${SALON_AGENT}`, { headers: H })).json();
console.log('Шаблон (salon) → model:', tmpl.config.llmConfig.vendor + '/' + tmpl.config.llmConfig.model,
  '| tts:', tmpl.config.ttsConfig.vendor + '/' + tmpl.config.ttsConfig.voiceId);

// 2. Создаём агента dental с book_appointment в tools.
const BOOK_APPOINTMENT = tmpl.config.tools.find(t => t.name === 'book_appointment');
if (!BOOK_APPOINTMENT) { console.error('book_appointment не найден в шаблоне!'); process.exit(1); }

const agentBody = {
  name: 'dental-ru',
  config: {
    ...tmpl.config,
    llmConfig: { ...tmpl.config.llmConfig, prompt: PROMPT },
    tools: tmpl.config.tools.filter(t => !['check_availability', 'book_car'].includes(t.name)),
  },
};

const createRes = await fetch(`${BASE}/api/v1/agents`, {
  method: 'POST', headers: H, body: JSON.stringify(agentBody),
});
if (!createRes.ok) {
  console.log('POST agent:', createRes.status, (await createRes.text()).slice(0, 400));
  process.exit(1);
}
const agent = await createRes.json();
const agentId = agent.id ?? agent.agentId;
console.log('✅ Создан агент dental-ru:', agentId);

// 3. Создаём web-integration.
const wiBody = {
  name: 'dental-ru-web',
  agentId,
  enabled: true,
  features: [
    { name: 'AllowWebChat', enabled: false },
    { name: 'AllowWebCall', enabled: true },
    { name: 'SendCallResult', enabled: true },
    { name: 'SendToolCallLogs', enabled: true },
  ],
  widgetAppearance: { theme: 'dark' },
  tools: ['update_card', 'set_summary', 'lead_score', 'show_sms', 'request_callback', 'transfer', 'book_appointment'],
};
const wiRes = await fetch(`${BASE}/api/v1/web-integrations`, {
  method: 'POST', headers: H, body: JSON.stringify(wiBody),
});
if (!wiRes.ok) {
  console.log('POST web-integration:', wiRes.status, (await wiRes.text()).slice(0, 400));
  process.exit(1);
}
const wi = await wiRes.json();
const wiId = wi.id ?? wi.integrationId;
console.log('✅ Создана web-integration dental-ru-web:', wiId);
console.log('\n→ Добавь в backend/.env:\nDASHA_INTEGRATION_DENTAL=' + wiId);
console.log('\n→ Агент ID (для update-dental-agent.mjs):\nDENTAL_AGENT=' + agentId);
