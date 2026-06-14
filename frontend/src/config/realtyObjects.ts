// Каталог объектов недвижимости (зеркало базы из REALTY_PROMPT) —
// чтобы по записи на осмотр показать карточку объекта с характеристиками.
export interface RealtyObject {
  id: string;
  title: string;
  area: string;
  floor: string;
  price: string;
  deal: string; // продажа | аренда
  emoji: string;
  match: string[]; // отличительные подстроки для сопоставления со service
}

export const REALTY_OBJECTS: RealtyObject[] = [
  { id: '1024', title: 'Студия, ЖК «Парк»', area: '26 м²', floor: '8/25 эт', price: '4 300 000 ₽', deal: 'продажа', emoji: '🏢', match: ['парк', 'студия'] },
  { id: '1051', title: '1-комн., ул. Ленина 12', area: '38 м²', floor: '5/9 эт', price: '5 900 000 ₽', deal: 'продажа', emoji: '🏠', match: ['ленина 12'] },
  { id: '1078', title: '2-комн., ул. Садовая 3', area: '48 м²', floor: '7/10 эт', price: '7 200 000 ₽', deal: 'продажа', emoji: '🏠', match: ['садовая'] },
  { id: '1093', title: '2-комн., пр. Мира 8', area: '54 м²', floor: '3/12 эт', price: '8 500 000 ₽', deal: 'продажа', emoji: '🏠', match: ['мира'] },
  { id: '1110', title: '3-комн., ул. Гагарина 20', area: '76 м²', floor: '4/16 эт', price: '11 500 000 ₽', deal: 'продажа', emoji: '🏠', match: ['гагарина'] },
  { id: '1137', title: '3-комн., ЖК «Ривьера»', area: '88 м²', floor: '10/18 эт', price: '14 000 000 ₽', deal: 'продажа', emoji: '🏙️', match: ['ривьера'] },
  { id: '2008', title: 'Офис, БЦ «Меркурий», центр', area: '45 м²', floor: '3 эт', price: '95 000 ₽/мес', deal: 'аренда', emoji: '🏢', match: ['меркурий'] },
  { id: '2015', title: 'Офис, БЦ «Гранд», центр', area: '80 м²', floor: 'центр', price: '12 000 000 ₽', deal: 'продажа', emoji: '🏢', match: ['гранд'] },
  { id: '2029', title: 'Торговое помещение, ул. Ленина 5', area: '60 м²', floor: '1 эт, витрина', price: '150 000 ₽/мес', deal: 'аренда', emoji: '🏬', match: ['ленина 5', 'торгов'] },
  { id: '2044', title: 'Помещение, ТЦ «Плаза»', area: '120 м²', floor: 'свободного назначения', price: '18 000 000 ₽', deal: 'продажа', emoji: '🏬', match: ['плаза'] },
  { id: '2061', title: 'Склад, промзона «Восток»', area: '500 м²', floor: '—', price: '250 000 ₽/мес', deal: 'аренда', emoji: '📦', match: ['восток', 'склад'] },
];

export function matchObject(service: string): RealtyObject | undefined {
  const s = (service || '').toLowerCase();
  return REALTY_OBJECTS.find((o) => o.match.some((m) => s.includes(m)));
}
