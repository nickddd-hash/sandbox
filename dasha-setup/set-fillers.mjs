#!/usr/bin/env node
// Минимальный патч: меняет ТОЛЬКО fillers агента (промпт/модель/silence не трогает).
//   node dasha-setup/set-fillers.mjs               → один филлер ['секунду']
//   node dasha-setup/set-fillers.mjs "так" "минутку" → произвольный список
//   node dasha-setup/set-fillers.mjs --off          → выключить филлеры
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266';
const H = { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };

const off = process.argv.includes('--off');
const texts = process.argv.slice(2).filter((x) => x !== '--off');
const list = texts.length ? texts : ['секунду'];

const a = await (await fetch(`${BASE}/api/v1/agents/${AGENT}`, { headers: H })).json();
console.log('ДО → fillers:', JSON.stringify(a.config.features.fillers));
a.config.features.fillers = off
  ? { version: 'v1', isEnabled: false, strategy: { type: 'static', texts: [] } }
  : { version: 'v1', isEnabled: true, strategy: { type: 'static', texts: list } };

const put = await fetch(`${BASE}/api/v1/agents/${AGENT}`, { method: 'PUT', headers: H, body: JSON.stringify(a) });
console.log('PUT:', put.status);
if (!put.ok) { console.log(await put.text()); process.exit(1); }
const after = await (await fetch(`${BASE}/api/v1/agents/${AGENT}`, { headers: H })).json();
console.log('ПОСЛЕ → v' + after.version, '| fillers:', JSON.stringify(after.config.features.fillers),
  '| model:', after.config.llmConfig.model, '(не тронуто)');
