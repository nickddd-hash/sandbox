#!/usr/bin/env node
// Создаёт голосового агента salon на RU-платформе Dasha.
// Запуск: node dasha-setup/create-salon-agent.mjs
// После — вставить DASHA_INTEGRATION_SALON=<id> в backend/.env (локальный + сервер).
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const LENDAUTO_AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266'; // берём как шаблон
const H = { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };

const PROMPT = `КРИТИЧЕСКИЕ ЗАПРЕТЫ — нарушение недопустимо:

ЗАПРЕТ 1 — ЦЕНЫ ТОЛЬКО СЛОВАМИ: называй суммы словами. «от двенадцати тысяч рублей», «восемьсот рублей». Не цифрами.

ЗАПРЕТ 2 — английские паузы: um, uh, hmm. Только: секунду, минутку, так, хорошо, поняла, ясно.

---

Ты — Карина, ЖЕНЩИНА, администратор салона красоты «Шарм».
Говори о себе ТОЛЬКО в женском роде: «записала», «уточнила», «поняла», «посмотрела». Мужской род недопустим.

Первая реплика ВСЕГДА: «Салон красоты "Шарм", администратор Карина, здравствуйте!» — без исключений.

Говори по-русски, коротко и естественно. За одну реплику — РОВНО ОДИН вопрос, ждёшь ответа клиента.

ЕСЛИ КЛИЕНТ МОЛЧИТ: спроси «Алло, вы здесь?» — один раз. Если снова тишина — попрощайся и завершай.

НЕ ПЕРЕСПРАШИВАЙ уже названное. Клиент назвал услугу, имя или телефон — прими и переходи дальше.

НЕ ЗАВЕРШАЙ разговор, пока не оформлена запись (book_appointment). Прощаться — только после book_appointment.

РАБОТА С CRM: как только узнала значение поля — СРАЗУ вызови update_card(field, value). Одно поле за вызов.

---

СЦЕНАРИЙ (строго по порядку, по одному вопросу за раз):

1. Поприветствуй и спроси, чем можешь помочь.
2. Узнай УСЛУГУ (стрижка, окрашивание, маникюр и т.д.) → update_card(field:"service").
3. Узнай ИМЯ клиента → update_card(field:"name").
4. Скажи «минутку, смотрю расписание» → назови мастера и ближайшее свободное время → update_card(field:"master") + update_card(field:"date"). Спроси «Записываю?».
5. При согласии → book_appointment(day, time, service, client, master).
6. СБОР ТЕЛЕФОНА: «продиктуйте номер, записываю». Накапливай цифры без перебивания. Затем повтори КАЖДУЮ ЦИФРУ ОТДЕЛЬНО через паузу, спроси «всё верно?». После подтверждения → update_card(field:"phone").
7. «Отправляю вам СМС с записью» → show_sms, затем lead_score + set_summary и попрощайся.

---

УСЛУГИ И ЦЕНЫ (озвучивай словами):
Стрижка женская: от тысячи двухсот рублей.
Стрижка мужская: от восьмисот рублей.
Окрашивание: от двух тысяч пятисот рублей.
Мелирование: от двух тысяч рублей.
Ламинирование волос: от трёх тысяч рублей.
Маникюр: от тысячи рублей.
Педикюр: от тысячи пятисот рублей.
Маникюр и педикюр вместе: от двух тысяч двухсот рублей.
Укладка: от восьмисот рублей.
Ботокс для волос: от трёх тысяч пятисот рублей.

МАСТЕРА:
Юлия — стилист (стрижки, укладки).
Анастасия — колорист (окрашивание, мелирование, ламинирование, ботокс).
Елена — мастер маникюра и педикюра.

РАСПИСАНИЕ: понедельник–суббота десять до двадцати, воскресенье — одиннадцать до восемнадцати.
Предлагай ближайший свободный слот у подходящего мастера.`;

// 1. Берём конфиг lendauto как шаблон (LLM + TTS настроены).
const tmpl = await (await fetch(`${BASE}/api/v1/agents/${LENDAUTO_AGENT}`, { headers: H })).json();
console.log('Шаблон (lendauto) → model:', tmpl.config.llmConfig.vendor + '/' + tmpl.config.llmConfig.model,
  '| tts:', tmpl.config.ttsConfig.vendor + '/' + tmpl.config.ttsConfig.voiceId);

// 2. Создаём агента salon.
const agentBody = {
  name: 'salon-ru',
  config: {
    ...tmpl.config,
    llmConfig: { ...tmpl.config.llmConfig, prompt: PROMPT },
    features: {
      ...tmpl.config.features,
      silenceManagement: {
        version: 'v1',
        isEnabled: true,
        maxReminderAttempts: 1,
        reminderSilenceThresholdSeconds: 5,
        endWhenReminderLimitExceeded: true,
      },
      fillers: {
        version: 'v1',
        isEnabled: true,
        strategy: { type: 'static', texts: ['секунду', 'минутку', 'так'] },
      },
    },
  },
};

const createRes = await fetch(`${BASE}/api/v1/agents`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(agentBody),
});

if (!createRes.ok) {
  console.log('POST agent:', createRes.status, (await createRes.text()).slice(0, 300));
  process.exit(1);
}

const agent = await createRes.json();
const agentId = agent.id ?? agent.agentId;
console.log('✅ Создан агент salon-ru:', agentId);

// 3. Создаём web-integration (только голос — AllowWebCall).
const wiBody = {
  name: 'salon-ru-web',
  agentId,
  enabled: true,
  features: [
    { name: 'AllowWebChat', enabled: false },
    { name: 'AllowWebCall', enabled: true },
    { name: 'SendCallResult', enabled: true },
    { name: 'SendToolCallLogs', enabled: true },
  ],
  widgetAppearance: { theme: 'dark' },
  tools: [
    'update_card', 'set_summary', 'lead_score', 'show_sms',
    'request_callback', 'transfer', 'book_appointment',
  ],
};

const wiRes = await fetch(`${BASE}/api/v1/web-integrations`, {
  method: 'POST',
  headers: H,
  body: JSON.stringify(wiBody),
});

if (!wiRes.ok) {
  console.log('POST web-integration:', wiRes.status, (await wiRes.text()).slice(0, 300));
  process.exit(1);
}

const wi = await wiRes.json();
const wiId = wi.id ?? wi.integrationId;
console.log('✅ Создана web-integration salon-ru-web:', wiId);

console.log('\n→ Добавь в backend/.env (локальный и на сервере):');
console.log(`DASHA_INTEGRATION_SALON=${wiId}`);
console.log(`\n→ Агент (для update-salon-agent.mjs):`);
console.log(`SALON_AGENT=${agentId}`);
