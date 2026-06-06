import type { NicheConfig } from '../types';

// Конфиг ниш: поля карточки CRM, ROI-параметры и скриптованный сценарий для симулятора.
// Скрипт = ровно та последовательность реплик и tool-вызовов, что прислал бы агент Dasha.

const dental: NicheConfig = {
  id: 'dental',
  label: 'Стоматология',
  emoji: '🦷',
  agentName: 'Анна, администратор клиники',
  fields: [
    { key: 'name', label: 'Имя' },
    { key: 'phone', label: 'Телефон' },
    { key: 'service', label: 'Услуга' },
    { key: 'date', label: 'Желаемая дата' },
    { key: 'doctor', label: 'Врач' },
  ],
  roi: {
    aiCostPerCall: 4,
    humanCostPerCall: 55,
    missedCallValue: 4500, // несостоявшийся приём
    defaultCallsPerDay: 40,
    defaultManagerSalary: 60000,
  },
  script: [
    { at: 600, say: { from: 'agent', text: 'Стоматология «Денталюкс», меня зовут Анна. Чем могу помочь?' } },
    { at: 2200, say: { from: 'user', text: 'Здравствуйте, хочу записаться на чистку зубов.' } },
    { at: 3200, tool: { name: 'update_card', args: { field: 'service', value: 'Профгигиена (чистка)' } } },
    { at: 3800, say: { from: 'agent', text: 'Конечно. Подскажите, как вас зовут?' } },
    { at: 5200, say: { from: 'user', text: 'Игорь.' } },
    { at: 5600, tool: { name: 'update_card', args: { field: 'name', value: 'Игорь' } } },
    { at: 6400, say: { from: 'agent', text: 'Игорь, на какую дату удобно?' } },
    { at: 7800, say: { from: 'user', text: 'Можно в эту субботу.' } },
    { at: 8200, say: { from: 'agent', text: 'Минутку, проверяю расписание…' } },
    { at: 9800, tool: { name: 'update_card', args: { field: 'date', value: 'Сб, 14:30' } } },
    { at: 10200, tool: { name: 'update_card', args: { field: 'doctor', value: 'Гигиенист Петрова' } } },
    { at: 10600, say: { from: 'agent', text: 'Есть суббота в 14:30 у гигиениста Петровой. Записываю?' } },
    { at: 12000, say: { from: 'user', text: 'Да, давайте.' } },
    { at: 12600, tool: { name: 'lead_score', args: { score: 85, sentiment: 'позитивный' } } },
    { at: 13200, tool: { name: 'show_sms', args: { text: 'Вы записаны: Сб 14:30. Подтвердите визит:', link: 'денталюкс.рф/visit/8421' } } },
    { at: 14200, tool: { name: 'set_summary', args: { text: 'Игорь записан на профгигиену в субботу 14:30 к гигиенисту Петровой. Отправлено SMS с подтверждением.' } } },
    { at: 15200, say: { from: 'agent', text: 'Готово! Отправила вам SMS со ссылкой на подтверждение. Ждём вас в субботу.' } },
    { at: 16500, tool: { name: 'request_callback', args: { delaySeconds: 10, reason: 'Напоминание о визите за день' } } },
  ],
};

const auto: NicheConfig = {
  id: 'auto',
  label: 'Автосервис',
  emoji: '🔧',
  agentName: 'Сергей, мастер-приёмщик',
  fields: [
    { key: 'name', label: 'Имя' },
    { key: 'phone', label: 'Телефон' },
    { key: 'car', label: 'Автомобиль' },
    { key: 'service', label: 'Работа' },
    { key: 'date', label: 'Запись' },
  ],
  roi: {
    aiCostPerCall: 4,
    humanCostPerCall: 50,
    missedCallValue: 6000,
    defaultCallsPerDay: 35,
    defaultManagerSalary: 65000,
  },
  script: [
    { at: 600, say: { from: 'agent', text: 'Автосервис «ТочкаОпоры», Сергей. Слушаю вас.' } },
    { at: 2200, say: { from: 'user', text: 'Нужно записаться на замену масла, машина Киа Рио.' } },
    { at: 3000, tool: { name: 'update_card', args: { field: 'car', value: 'Kia Rio' } } },
    { at: 3500, tool: { name: 'update_card', args: { field: 'service', value: 'Замена масла + фильтр' } } },
    { at: 4200, say: { from: 'agent', text: 'Принял. Как к вам обращаться?' } },
    { at: 5400, say: { from: 'user', text: 'Дмитрий.' } },
    { at: 5800, tool: { name: 'update_card', args: { field: 'name', value: 'Дмитрий' } } },
    { at: 6600, say: { from: 'agent', text: 'Секунду, смотрю свободные окна…' } },
    { at: 8200, tool: { name: 'update_card', args: { field: 'date', value: 'Завтра, 11:00' } } },
    { at: 8700, say: { from: 'agent', text: 'Есть завтра в 11:00. Подходит?' } },
    { at: 10000, say: { from: 'user', text: 'Да, отлично.' } },
    { at: 10600, tool: { name: 'lead_score', args: { score: 78, sentiment: 'позитивный' } } },
    { at: 11200, tool: { name: 'show_sms', args: { text: 'Запись на замену масла завтра 11:00. Адрес и детали:', link: 'точкаопоры.рф/z/3391' } } },
    { at: 12200, tool: { name: 'set_summary', args: { text: 'Дмитрий, Kia Rio — замена масла и фильтра, запись на завтра 11:00. Отправлено SMS с адресом.' } } },
    { at: 13200, say: { from: 'agent', text: 'Записал, отправил SMS с адресом. До завтра!' } },
  ],
};

const meat: NicheConfig = {
  id: 'meat',
  label: 'Мясной B2B',
  emoji: '🥩',
  agentName: 'Ольга, отдел продаж',
  fields: [
    { key: 'company', label: 'Компания' },
    { key: 'name', label: 'Контакт' },
    { key: 'phone', label: 'Телефон' },
    { key: 'product', label: 'Позиция' },
    { key: 'volume', label: 'Объём' },
  ],
  roi: {
    aiCostPerCall: 5,
    humanCostPerCall: 70,
    missedCallValue: 25000, // упущенная оптовая заявка
    defaultCallsPerDay: 25,
    defaultManagerSalary: 80000,
  },
  script: [
    { at: 600, say: { from: 'agent', text: 'Мясокомбинат «Сибагро», отдел продаж, Ольга. Здравствуйте!' } },
    { at: 2400, say: { from: 'user', text: 'Здравствуйте, интересует оптом говяжья вырезка.' } },
    { at: 3200, tool: { name: 'update_card', args: { field: 'product', value: 'Говяжья вырезка (охл.)' } } },
    { at: 4000, say: { from: 'agent', text: 'Какой ориентировочный объём в месяц и от какой компании?' } },
    { at: 5800, say: { from: 'user', text: 'Около 500 кг, ресторан «Прайм».' } },
    { at: 6300, tool: { name: 'update_card', args: { field: 'volume', value: '~500 кг/мес' } } },
    { at: 6800, tool: { name: 'update_card', args: { field: 'company', value: 'Ресторан «Прайм»' } } },
    { at: 7600, say: { from: 'agent', text: 'Минутку, поднимаю прайс по этому объёму…' } },
    { at: 9400, say: { from: 'agent', text: 'На 500 кг действует оптовая цена с отсрочкой. С кем оформляем?' } },
    { at: 11000, say: { from: 'user', text: 'Андрей, закупки.' } },
    { at: 11400, tool: { name: 'update_card', args: { field: 'name', value: 'Андрей (закупки)' } } },
    { at: 12200, tool: { name: 'lead_score', args: { score: 90, sentiment: 'горячий' } } },
    { at: 13000, tool: { name: 'show_sms', args: { text: 'Прайс и КП на говяжью вырезку 500 кг/мес:', link: 'сибагро.рф/kp/7712' } } },
    { at: 14000, tool: { name: 'set_summary', args: { text: 'Ресторан «Прайм» (Андрей, закупки): говяжья вырезка охл. ~500 кг/мес. Отправлено КП с оптовой ценой. Лид горячий.' } } },
    { at: 15000, say: { from: 'agent', text: 'Отправила КП на ваш телефон. Передам менеджеру для договора.' } },
    { at: 16500, tool: { name: 'transfer', args: { reason: 'Передача горячего опта персональному менеджеру' } } },
  ],
};

const salon: NicheConfig = {
  id: 'salon',
  label: 'Салон красоты',
  emoji: '💇',
  agentName: 'Карина, администратор',
  fields: [
    { key: 'name', label: 'Имя' },
    { key: 'phone', label: 'Телефон' },
    { key: 'service', label: 'Услуга' },
    { key: 'master', label: 'Мастер' },
    { key: 'date', label: 'Запись' },
  ],
  roi: {
    aiCostPerCall: 4,
    humanCostPerCall: 45,
    missedCallValue: 3000,
    defaultCallsPerDay: 50,
    defaultManagerSalary: 50000,
  },
  script: [
    { at: 600, say: { from: 'agent', text: 'Салон «Шарм», администратор Карина. Здравствуйте!' } },
    { at: 2200, say: { from: 'user', text: 'Хочу записаться на стрижку и окрашивание.' } },
    { at: 3000, tool: { name: 'update_card', args: { field: 'service', value: 'Стрижка + окрашивание' } } },
    { at: 3800, say: { from: 'agent', text: 'Прекрасно! Как вас зовут?' } },
    { at: 5000, say: { from: 'user', text: 'Марина.' } },
    { at: 5400, tool: { name: 'update_card', args: { field: 'name', value: 'Марина' } } },
    { at: 6200, say: { from: 'agent', text: 'Минутку, подбираю мастера и время…' } },
    { at: 8000, tool: { name: 'update_card', args: { field: 'master', value: 'Стилист Юлия' } } },
    { at: 8400, tool: { name: 'update_card', args: { field: 'date', value: 'Чт, 18:00' } } },
    { at: 8900, say: { from: 'agent', text: 'Есть четверг в 18:00 у стилиста Юлии. Записываю?' } },
    { at: 10200, say: { from: 'user', text: 'Да!' } },
    { at: 10800, tool: { name: 'lead_score', args: { score: 80, sentiment: 'позитивный' } } },
    { at: 11400, tool: { name: 'show_sms', args: { text: 'Запись: Чт 18:00, стилист Юлия. Перенести/отменить:', link: 'шарм.рф/v/5563' } } },
    { at: 12400, tool: { name: 'set_summary', args: { text: 'Марина — стрижка и окрашивание, четверг 18:00, стилист Юлия. Отправлено SMS с записью.' } } },
    { at: 13400, say: { from: 'agent', text: 'Записала! Прислала SMS с деталями. Ждём вас в четверг.' } },
  ],
};

export const NICHES: Record<string, NicheConfig> = { dental, auto, meat, salon };
// Салон — первый в списке и дефолтный: с него стартуем живое подключение Dasha.
export const NICHE_LIST: NicheConfig[] = [salon, dental, auto, meat];
export const DEFAULT_NICHE: NicheConfig = salon;
