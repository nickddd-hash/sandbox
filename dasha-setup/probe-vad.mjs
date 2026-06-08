#!/usr/bin/env node
// Зонд turn-taking: GET текущий turnTaking; с аргументом — PUT нового vad и печать ответа/ошибки.
//   node dasha-setup/probe-vad.mjs            — показать текущее
//   node dasha-setup/probe-vad.mjs <vad>      — попробовать значение (сервер подскажет валидные)
process.loadEnvFile('backend/.env');
const KEY = process.env.DASHA_API_KEY;
const BASE = process.env.DASHA_BASE_URL || 'https://blackbox.ru.dasha.ai';
const AGENT = 'b37dfcf5-3701-432f-b5a0-305b84dcc266';
const H = { Authorization: `Bearer ${KEY}`, 'content-type': 'application/json' };
const vad = process.argv[2];

const a = await (await fetch(`${BASE}/api/v1/agents/${AGENT}`, { headers: H })).json();
console.log('turnTaking сейчас:', JSON.stringify(a.config.features.turnTaking));
if (!vad) process.exit(0);
a.config.features.turnTaking = { ...a.config.features.turnTaking, version: 'v1', vad };
const p = await fetch(`${BASE}/api/v1/agents/${AGENT}`, { method: 'PUT', headers: H, body: JSON.stringify(a) });
console.log('PUT vad=' + vad + ' →', p.status);
console.log((await p.text()).slice(0, 500));
