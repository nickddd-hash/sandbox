import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const SYSTEM_PROMPT = `Ты — Марина, ЖЕНЩИНА, менеджер компании «Лэнд Авто» по аренде автомобилей. Работаешь в текстовом чате.
Говори о себе ТОЛЬКО в женском роде: «записала», «уточнила», «поняла», «посмотрела», «нашла». Мужской род недопустим.

Первое сообщение ВСЕГДА: «Лэнд Авто, добрый день! Меня зовут Марина, чем могу помочь?»

Пиши коротко и по делу. За один ответ — РОВНО ОДИН вопрос, ждёшь ответа клиента.
НЕ ПЕРЕСПРАШИВАЙ уже написанное. Назвал клиент город, даты, авто, имя или телефон — прими и переходи к следующему полю.
НЕ ЗАВЕРШАЙ диалог, пока не собраны все поля и не оформлена бронь (book_car).

ДАТЫ: Если клиент называет только число без месяца (например «по 20», «до 25-го»), возьми месяц из уже названной даты начала. Пример: «с 15 июля» → «по 20» = 20 июля. Храни полную дату (день + месяц + год).

ОБЯЗАТЕЛЬНО: НИКОГДА не говори «записала», «поняла», «принято», «отлично» без немедленного вызова соответствующего update_card. Сначала ВЫЗОВ TOOL, потом фраза-подтверждение.

СЛОВА ПРО БРОНЬ: НИКОГДА не использовать: бронирование, забронировать, бронируем, бронировка.
Только: «бронь», «оформить бронь», «бронь оформлена», «ваша бронь».

ЦЕНЫ И ЧИСЛА: пиши цифрами — «10 300 ₽», «2 000 ₽/сут», «5 суток».
ТЕЛЕФОН при повторе: цифры с дефисами — «8-923-456-78-90, всё верно?».

РАБОТА С CRM: как только узнала поле — вызови соответствующий tool. Одно поле за вызов.

СЦЕНАРИЙ (по одному вопросу за раз):
1. Поприветствуй и спроси, чем помочь.
2. Узнай ГОРОД → update_card(city).
3. Узнай ДАТУ НАЧАЛА → update_card(dateFrom).
4. Узнай ДАТУ ОКОНЧАНИЯ → update_card(dateTo).
5. Узнай КЛАСС или бюджет (эконом / комфорт / бизнес / внедорожник).
6. По названному классу выбери конкретный автомобиль из парка. Напиши: «[авто] свободна на эти даты!» → update_card(field:"car", value:"[авто]"). Переходи к шагу 7.
7. Узнай ИМЯ → update_card(name).
8. Попроси телефон, повтори с дефисами, подтверди → update_card(phone).
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

const TOOLS = [
  { name: 'update_card', description: 'Записать значение поля в CRM-карточку', parameters: { type: 'object', properties: { field: { type: 'string', description: 'city|dateFrom|dateTo|car|name|phone' }, value: { type: 'string' } }, required: ['field', 'value'] } },
  { name: 'set_summary', description: 'Итоговое саммари разговора', parameters: { type: 'object', properties: { text: { type: 'string' } }, required: ['text'] } },
  { name: 'lead_score', description: 'Оценка лида', parameters: { type: 'object', properties: { score: { type: 'number' }, sentiment: { type: 'string' } }, required: ['score', 'sentiment'] } },
  { name: 'show_sms', description: 'Показать SMS со ссылкой', parameters: { type: 'object', properties: { text: { type: 'string' }, link: { type: 'string' } }, required: ['text', 'link'] } },
  { name: 'book_car', description: 'Оформить бронь', parameters: { type: 'object', properties: { car: { type: 'string' }, dateFrom: { type: 'string' }, dateTo: { type: 'string' }, client: { type: 'string' }, city: { type: 'string' } }, required: ['car', 'dateFrom', 'dateTo', 'client'] } },
  { name: 'request_callback', description: 'Запросить обратный звонок', parameters: { type: 'object', properties: { delaySeconds: { type: 'number' }, reason: { type: 'string' } }, required: ['delaySeconds', 'reason'] } },
  { name: 'transfer', description: 'Перевести на живого оператора', parameters: { type: 'object', properties: { reason: { type: 'string' } }, required: ['reason'] } },
];

type Message = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string | null; tool_call_id?: string; tool_calls?: ToolCall[] };

interface ToolCall { id: string; type: 'function'; function: { name: string; arguments: string } }

export async function chatRoutes(app: FastifyInstance): Promise<void> {
  app.post('/api/chat', async (req, reply) => {
    const { message, history = [] } = (req.body ?? {}) as {
      message?: string;
      history?: { role: 'user' | 'assistant'; content: string }[];
    };

    if (!config.hubris.apiKey) {
      return reply.code(503).send({ error: 'hubris_not_configured' });
    }

    const messages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      ...(message ? [{ role: 'user' as const, content: message }] : []),
    ];

    const toolCalls: { id: string; name: string; args: Record<string, unknown> }[] = [];

    // Цикл tool-calling: LLM может вызвать несколько tools подряд.
    for (let i = 0; i < 8; i++) {
      const res = await fetch(`${config.hubris.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${config.hubris.apiKey}` },
        body: JSON.stringify({ model: config.hubris.model, messages, tools: TOOLS.map((t) => ({ type: 'function', function: t })), tool_choice: 'auto' }),
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
        // При выборе авто инжектируем визуальный check_availability для RentalBoard
        if (tc.function.name === 'update_card' && (args as { field?: string }).field === 'car') {
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
