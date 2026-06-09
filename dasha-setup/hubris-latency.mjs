#!/usr/bin/env node
// Замер TTFT (время до первого токена) напрямую к LLM-эндпоинту агента (Hubris),
// чтобы понять: тормозит сам прокси или связка Dasha→Hubris, и какая умная модель быстрее.
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266';

const a = await (await fetch(`${BASE}/api/v1/agents/${AGENT}`, { headers: { Authorization: `Bearer ${KEY}` } })).json();
const llm = a.config.llmConfig;
const endpoint = (llm.apiEndpoint || llm.endpoint || llm.baseUrl || '').replace(/\/$/, '');
const apiKey = llm.apiKey;
console.log('endpoint:', endpoint, '| текущая модель:', llm.model, '| ключ:', apiKey ? 'есть (' + apiKey.length + ' симв.)' : 'НЕ виден в GET');
if (!endpoint || !apiKey) { console.log('Нет endpoint/ключа в конфиге — напрямую замерить нельзя.'); process.exit(0); }

// Сначала — каталог моделей Hubris, отфильтруем «быстрых» кандидатов.
try {
  const list = await (await fetch(`${endpoint}/models`, { headers: { Authorization: `Bearer ${apiKey}` } })).json();
  const ids = (list.data || list || []).map((m) => m.id || m).filter(Boolean);
  const re = /haiku|gpt-4o|gpt-4\.1|gemini.*(flash|lite)|deepseek|mini|nano|flash|turbo|grok.*(mini|fast)/i;
  console.log('Всего моделей:', ids.length, '| быстрые кандидаты:');
  console.log('  ' + ids.filter((i) => re.test(i)).join('\n  '));
  console.log('---');
} catch (e) { console.log('каталог /models не получил:', e.message); }

const models = ['deepseek/deepseek-chat', 'deepseek/deepseek-chat-v3.1', 'google/gemini-2.5-flash-lite', 'openai/gpt-4.1-nano', 'openai/gpt-5-mini', 'google/gemini-2.5-flash'];
const RUNS = 3;
const messages = [
  { role: 'system', content: 'Ты Марина, менеджер проката авто. Отвечай одной короткой фразой по-русски.' },
  { role: 'user', content: 'Здравствуйте, хочу арендовать машину в Москве.' },
];

const once = async (model) => {
  const t0 = Date.now();
  const res = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 60 }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + (await res.text()).slice(0, 60));
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let ttft = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!ttft && /"content":"[^"]/.test(dec.decode(value))) ttft = Date.now() - t0;
  }
  return ttft;
};

console.log('\nTTFT финалистов (' + RUNS + ' прогона):');
for (const model of models) {
  const ttfts = [];
  let err = '';
  for (let i = 0; i < RUNS; i++) {
    try { ttfts.push(await once(model)); } catch (e) { err = e.message; break; }
  }
  if (err) { console.log('  ' + model.padEnd(30), '→', err); continue; }
  const min = Math.min(...ttfts), avg = Math.round(ttfts.reduce((a, b) => a + b, 0) / ttfts.length);
  console.log('  ' + model.padEnd(30), `→ min ${min} / avg ${avg} мс  [${ttfts.join(', ')}]`);
}
