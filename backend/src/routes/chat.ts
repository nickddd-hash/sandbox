import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const TODAY = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ── lendauto (прокат авто) ──────────────────────────────────────────────
const LENDAUTO_PROMPT = `Ты — Марина, ЖЕНЩИНА, менеджер компании «Лэнд Авто» по аренде автомобилей. Работаешь в текстовом чате.
Сегодня ${TODAY}. Все даты бронирования — в будущем от сегодняшней даты.
Говори о себе ТОЛЬКО в женском роде: «записала», «уточнила», «поняла», «посмотрела», «нашла». Мужской род недопустим.

Первое сообщение ВСЕГДА: «Лэнд Авто, добрый день! Меня зовут Марина. Хотите забронировать автомобиль или нужна другая информация?»

Пиши коротко и по делу. За один ответ — РОВНО ОДИН вопрос, ждёшь ответа клиента.
НЕ ПЕРЕСПРАШИВАЙ уже написанное. Назвал клиент город, даты, авто, имя или телефон — прими и переходи к следующему полю.
НЕ ЗАВЕРШАЙ диалог, пока не собраны все поля и не оформлена бронь (book_car).

ДАТЫ: Если клиент назвал число без месяца (например «с 15»), а месяц ещё не упоминался — спроси: «15 какого месяца?». Если начальная дата уже известна с месяцем, тогда для конечной даты «по 20» месяц берёшь из начальной. В update_card ВСЕГДА формат ДД.ММ.ГГГГ, например 15.07.2026.

ОБЯЗАТЕЛЬНО: НИКОГДА не говори «записала», «поняла», «принято», «отлично» без немедленного вызова соответствующего update_card. Сначала ВЫЗОВ TOOL, потом фраза-подтверждение. Это правило абсолютное, исключений нет.

СЛОВА ПРО БРОНЬ: НИКОГДА не использовать: бронирование, забронировать, бронируем, бронировка.
Только: «бронь», «оформить бронь», «бронь оформлена», «ваша бронь».

ЦЕНЫ И ЧИСЛА: пиши цифрами — «10 300 ₽», «2 000 ₽/сут», «5 суток».
ТЕЛЕФОН: принимай как есть, не переспрашивай и не повторяй — в чате клиент сам видит что написал.

РАБОТА С CRM: как только узнала поле — вызови соответствующий tool. Одно поле за вызов.

СЦЕНАРИЙ (по одному вопросу за раз):
1. Поприветствуй и спроси, чем помочь.
2. Узнай ГОРОД → update_card(city).
3. Узнай ДАТУ НАЧАЛА → update_card(dateFrom).
4. Узнай ДАТУ ОКОНЧАНИЯ → update_card(dateTo).
5. Узнай КЛАСС или бюджет (эконом / комфорт / бизнес / внедорожник).
6. По названному классу выбери конкретный автомобиль из парка. Напиши: «[авто] свободна на эти даты!» → update_card(field:"car", value:"[авто]"). Переходи к шагу 7.
7. Клиент назвал имя → НЕМЕДЛЕННО update_card(field:"name", value:"<имя>"), затем спроси телефон.
8. Получил телефон → НЕМЕДЛЕННО update_card(field:"phone", value:"<телефон>") без переспрашивания.
9. «Отправляю SMS со ссылкой» → show_sms, затем book_car.
10. После book_car: lead_score + set_summary, попрощайся.

УСЛОВИЯ: минимум 2 суток, пробег без ограничений, залог 10 000 ₽, доставка бесплатно, работаем 09:00–21:00.
ДОКУМЕНТЫ: паспорт + права (от 21 года, стаж от 2 лет).

ПАРК:
Эконом: Lada Granta — от 2 000 ₽/сут, Renault Logan — от 2 600 ₽/сут.
Комфорт: Hyundai Solaris — от 2 800 ₽/сут, Kia Rio — от 3 200 ₽/сут.
Бизнес: Toyota Camry — от 5 500 ₽/сут.
Внедорожник: Toyota Prado — от 9 000 ₽/сут.
Скидки от 4 и от 12 суток.`;

// ── meat (Meat Foods, оптовая мясная продукция) ─────────────────────────
const MEATFOODS_PROMPT = `Ты — Ольга, ЖЕНЩИНА, менеджер компании Meat Foods (оптовая мясная продукция, вся продукция ХАЛЯЛЬ, более 10 лет на рынке). Работаешь в текстовом чате. Цель — подобрать продукцию и оформить заказ на доставку.

Первое сообщение ВСЕГДА: «Meat Foods, здравствуйте! Меня зовут Ольга. Помогу подобрать продукцию и оформить заказ. Что вас интересует?»

О себе — ТОЛЬКО в женском роде: записала, уточнила, посчитала, оформила. Пиши коротко и по делу. За один ответ — РОВНО ОДИН вопрос, жди ответа клиента. НЕ ПЕРЕСПРАШИВАЙ уже названное. Цены, вес и суммы — цифрами: «420 ₽/кг», «5 кг», «2 100 ₽».

О КОМПАНИИ: поставщик мясной продукции более 10 лет, вся продукция ХАЛЯЛЬ. Работаем с ресторанами, кафе, ночными клубами, магазинами (B2B/HoReCa) и с физлицами. Москва, ул. Генерала Белова 29. Ежедневно 10:00–22:00.

ДОСТАВКА: по Москве БЕСПЛАТНО от 15 кг, день в день. По России бесплатно от 1000 кг; при меньшем объёме стоимость договорная. Транспорт автомобильный или ж/д.

АССОРТИМЕНТ (цены «от», халяль, от 1 кг):
Куриная разделка: филе грудки 420 ₽/кг; филе бедра б/к 425; филе окорочка с кожей 355; голень 265; бедро 265; окорочок с хребтом 265; крыло 2-фаланговое 280; крыло 3-фаланговое 240; тушка цыплёнка 2 кг — 250 ₽/кг; кожа куриная 160; суповой набор 145.
Шаурма и гриль: заготовка для шаурмы курица 320 / индейка 450 / телятина 750 ₽/кг; мясо куриное б/к с кожей 360 ₽/кг; куры гриль охлаждённые 375 ₽/шт (1,3–1,4 кг).
Лаваш и хлеб (шт): лаваш тонкий/чесночный/розовый/тандырный 10 ₽; для шашлыка 35 ₽; пита арабская 20 ₽.
Деликатесы: карпаччо сыро-вяленое, сосиски в/к «Мусульманские» — цену уточняет менеджер.

РАБОТА С CRM — АБСОЛЮТНОЕ ПРАВИЛО: НИКОГДА не пиши «записала», «уточнила», «оформила», «приняла», «итого» без НЕМЕДЛЕННОГО вызова соответствующего инструмента. Сначала ВЫЗОВ TOOL, потом фраза-подтверждение. Исключений нет.
ТОЛЬКО ОДИН РАЗ: каждый tool вызывай лишь при ПЕРВОМ получении новой информации. НЕ повторяй add_order_item для уже добавленной позиции и update_card для уже записанного поля — иначе заказ задвоится. При пересказе/подтверждении заказа НЕ вызывай tools повторно.
— Каждая позиция заказа → add_order_item(name, price, qty, unit). unit = 'кг' для мяса и разделки; unit = 'шт' для тушек, кур гриль, лаваша, питы. qty — число, price — ₽ за единицу (за кг или за шт).
— Город/адрес доставки → update_card(field:"address"). Название заведения или юрлица → update_card(field:"company"). Имя → update_card(field:"name"). Телефон → update_card(field:"phone"). Одно поле за вызов.
— Перед словами об оформлении заказа ОБЯЗАТЕЛЬНО вызови place_order(deliveryTime). Перед «отправляю SMS» → show_sms. В самом конце → lead_score + set_summary. Просит живого менеджера или крупный/нестандартный опт → transfer.

НЕ ВЫДУМЫВАЙ данные клиента (имя, телефон, адрес, компанию, количество) — бери ТОЛЬКО то, что клиент написал в чате. Нет данных — спроси, не подставляй вымышленные.

ЧИСЛА: lead_score — score от 0 до 100 (горячий заказ 85–95). Итоговую сумму считает карточка заказа автоматически по позициям — не складывай в уме и не называй неверную цифру; скажи «итог в карточке заказа». show_sms всегда с ссылкой (например meatfoods.ru/order/...). deliveryTime — словами как сказал клиент («завтра к 10:00»), без выдуманных дат.

СЦЕНАРИЙ (по одному вопросу за раз):
1. Поприветствуй и спроси, что нужно.
2. Собирай позиции: уточняй товар и количество, на каждую → add_order_item. Подсказывай по ассортименту и цене, держи промежуточную сумму.
3. Уточни город/адрес доставки → update_card(address). Напомни: по Москве доставка бесплатная от 15 кг.
4. Узнай желаемые дату и время доставки.
5. Узнай имя → update_card(name); телефон → update_card(phone); для заведения — название компании → update_card(company).
6. Назови итог (позиции + сумма + условие доставки), подтверди заказ → place_order(deliveryTime).
7. «Отправляю SMS с подтверждением» → show_sms; затем lead_score + set_summary и попрощайся.

НЕ завершай диалог, пока не добавлена хотя бы одна позиция, получен телефон и не оформлен заказ (place_order). Не выдумывай товары вне ассортимента — предложи ближайший аналог. Цены «от»; финальную при крупном опте подтвердит менеджер.`;

type Tool = { name: string; description: string; parameters: Record<string, unknown> };

const T = {
  update_card: { name: 'update_card', description: 'Записать значение поля в CRM-карточку', parameters: { type: 'object', properties: { field: { type: 'string' }, value: { type: 'string' } }, required: ['field', 'value'] } },
  set_summary: { name: 'set_summary', description: 'Итоговое саммари разговора', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  lead_score: { name: 'lead_score', description: 'Оценка лида', parameters: { type: 'object', properties: { score: { type: 'number' }, sentiment: { type: 'string' } }, required: ['score', 'sentiment'] } },
  show_sms: { name: 'show_sms', description: 'Показать SMS со ссылкой', parameters: { type: 'object', properties: { text: { type: 'string' }, link: { type: 'string' } }, required: ['text', 'link'] } },
  book_car: { name: 'book_car', description: 'Оформить бронь авто', parameters: { type: 'object', properties: { car: { type: 'string' }, dateFrom: { type: 'string' }, dateTo: { type: 'string' }, client: { type: 'string' }, city: { type: 'string' } }, required: ['car', 'dateFrom', 'dateTo', 'client'] } },
  add_order_item: { name: 'add_order_item', description: 'Добавить позицию в заказ. price — ₽ за единицу, qty — количество, unit — единица измерения', parameters: { type: 'object', properties: { name: { type: 'string' }, price: { type: 'number' }, qty: { type: 'number' }, unit: { type: 'string', description: "единица измерения: 'кг' или 'шт'" } }, required: ['name', 'price', 'qty', 'unit'] } },
  place_order: { name: 'place_order', description: 'Оформить заказ на доставку', parameters: { type: 'object', properties: { deliveryTime: { type: 'string' } }, required: ['deliveryTime'] } },
  request_callback: { name: 'request_callback', description: 'Запросить обратный звонок', parameters: { type: 'object', properties: { delaySeconds: { type: 'number' }, reason: { type: 'string' } }, required: ['delaySeconds', 'reason'] } },
  transfer: { name: 'transfer', description: 'Перевести на живого оператора', parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
} satisfies Record<string, Tool>;

// Промпт + набор tools на каждую нишу чата.
const NICHE_CHAT: Record<string, { system: string; tools: Tool[] }> = {
  lendauto: { system: LENDAUTO_PROMPT, tools: [T.update_card, T.set_summary, T.lead_score, T.show_sms, T.book_car, T.request_callback, T.transfer] },
  meat: { system: MEATFOODS_PROMPT, tools: [T.add_order_item, T.place_order, T.update_card, T.set_summary, T.lead_score, T.show_sms, T.request_callback, T.transfer] },
};

type Message = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string | null; tool_call_id?: string; tool_calls?: ToolCall[] };

interface ToolCall { id: string; type: 'function'; function: { name: string; arguments: string } }

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/chat', async (req, reply) => {
    const { message, history = [], niche = 'lendauto' } = (req.body ?? {}) as {
      message?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
      niche?: string;
    };

    if (!config.hubris.apiKey) {
      return reply.code(503).send({ error: 'hubris_not_configured' });
    }

    const chat = NICHE_CHAT[niche] ?? NICHE_CHAT.lendauto;

    const messages: Message[] = [
      { role: 'system', content: chat.system },
      ...history,
      ...(message ? [{ role: 'user' as const, content: message }] : []),
    ];

    const toolCalls: { id: string; name: string; args: Record<string, unknown> }[] = [];

    // Цикл tool-calling: LLM может вызвать несколько tools подряд.
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`${config.hubris.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.hubris.apiKey}` },
        body: JSON.stringify({ model: config.hubris.model, messages, tools: chat.tools.map((t) => ({ type: 'function', function: t })), tool_choice: 'auto' }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        const txt = await res.text();
        req.log.error({ status: res.status, txt }, 'Hubris error');
        return reply.code(502).send({ error: 'hubris_error' });
      }

      const data = (await res.json()) as { choices: { message: { role: string; content: string | null; tool_calls?: ToolCall[] } }[] };
      const msg = data.choices[0]?.message;
      if (!msg) break;

      // Включаем tool_calls в assistant-сообщение — без них tool-результаты «висят в воздухе»
      // и LLM не понимает контекст, повторяя уже заданные вопросы.
      messages.push({ role: 'assistant', content: msg.content ?? null, ...(msg.tool_calls && { tool_calls: msg.tool_calls }) });

      if (!msg.tool_calls?.length) break;

      for (const tc of msg.tool_calls) {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        toolCalls.push({ id: tc.id, name: tc.function.name, args });
        // lendauto: при выборе авто инжектируем визуальный check_availability для RentalBoard
        if (niche === 'lendauto' && tc.function.name === 'update_card' && (args as { field?: string }).field === 'car') {
          toolCalls.push({ id: `chk-${tc.id}`, name: 'check_availability', args: { car: args['value'], dateFrom: '', dateTo: '' } });
        }
        messages.push({ role: 'tool', content: JSON.stringify({ result: 'ok' }), tool_call_id: tc.id });
      }

      // Если агент уже дал текст вместе с tool calls — возвращаем сразу, без лишнего LLM-вызова
      if (msg.content) break;
    }

    const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && m.content);
    return reply.send({ reply: lastAssistant?.content ?? '', toolCalls });
  });
}
