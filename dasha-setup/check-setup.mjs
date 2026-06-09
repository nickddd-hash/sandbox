#!/usr/bin/env node
// Диагностика конфига: модель, размер промпта, и — главное — все ли тулзы агента
// входят в client-side список web-интеграции (иначе уходят на webhook → латентность).
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266';
const INTEG = process.env.DASHA_INTEGRATION_LENDAUTO;
const H = { Authorization: `Bearer ${KEY}` };

const a = await (await fetch(`${BASE}/api/v1/agents/${AGENT}`, { headers: H })).json();
console.log('Агент: v' + a.version, '| model:', a.config.llmConfig.vendor + '/' + a.config.llmConfig.model);
const llm = a.config.llmConfig;
console.log('LLM endpoint:', llm.apiEndpoint || llm.endpoint || llm.baseUrl || '(дефолтный платформы)',
  '| свой ключ:', (llm.apiKey || llm.apiKeySet) ? 'да' : 'нет');
console.log('Промпт:', a.config.llmConfig.prompt.length, 'символов (~' + Math.round(a.config.llmConfig.prompt.length / 4) + ' токенов)');
console.log('turnTaking:', JSON.stringify(a.config.features.turnTaking), '| fillers:', JSON.stringify(a.config.features.fillers?.strategy));
const agentTools = a.config.tools.map((t) => t.name);
console.log('\nТулзы агента и их webhook:');
for (const t of a.config.tools) console.log('  ', t.name.padEnd(20), '→', t.webhook?.url || '(нет webhook)');

console.log('\nINTEG =', INTEG || '(пусто в .env!)');
const wiRes = await fetch(`${BASE}/api/v1/web-integrations/${INTEG}`, { headers: H });
const wiTxt = await wiRes.text();
let wi; try { wi = JSON.parse(wiTxt); } catch { console.log('web-integration ответ (' + wiRes.status + '):', wiTxt.slice(0, 200)); }
if (wi) {
  console.log('client-side тулзы web-интеграции:', (wi.tools || []).join(', '));
  const serverSide = agentTools.filter((t) => !(wi.tools || []).includes(t));
  console.log('\n⚠️ Уйдут на server-side webhook (НЕ в списке интеграции):',
    serverSide.length ? serverSide.join(', ') + '  ← ТОРМОЗИТ, если webhook недоступен' : 'нет — все client-side ✓');
}
