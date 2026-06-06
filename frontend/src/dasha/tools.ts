// Контракт client-side tools. Эти имена и схемы регистрируются в конфиге агента Dasha
// (как websocket-tools) и зеркалятся в store.applyTool. Список — единый источник правды
// о том, что агент умеет «делать руками» в интерфейсе песочницы.

export interface ToolSpec {
  name: string;
  description: string;
  args: Record<string, string>; // имя аргумента -> описание (для регистрации в Dasha)
}

export const TOOL_SPECS: ToolSpec[] = [
  {
    name: 'update_card',
    description: 'Заполнить или обновить поле карточки клиента в CRM по ходу разговора.',
    args: { field: 'ключ поля (name, phone, service, date, …)', value: 'значение' },
  },
  {
    name: 'set_summary',
    description: 'Записать краткое резюме разговора в карточку по завершении.',
    args: { text: 'текст резюме' },
  },
  {
    name: 'lead_score',
    description: 'Проставить оценку лида и тональность разговора.',
    args: { score: 'число 0–100', sentiment: 'горячий | позитивный | нейтральный | холодный' },
  },
  {
    name: 'show_sms',
    description: 'Отправить клиенту SMS со ссылкой (бронь, КП, подтверждение).',
    args: { text: 'текст SMS', link: 'ссылка' },
  },
  {
    name: 'request_callback',
    description: 'Запланировать обратный звонок (напоминание, дожим).',
    args: { delaySeconds: 'через сколько секунд', reason: 'повод звонка' },
  },
  {
    name: 'transfer',
    description: 'Перевести разговор на живого оператора.',
    args: { reason: 'причина перевода' },
  },
];

export const TOOL_NAMES = TOOL_SPECS.map((t) => t.name);
