# CLAUDE.md — память проекта «Тестовый отдел продаж»

Контекст для будущих сессий. Подробная архитектура — в [ARCHITECTURE.md](./ARCHITECTURE.md),
сетап Dasha — в [dasha-setup/SETUP.md](./dasha-setup/SETUP.md).

## Что это
Интерактивная песочница ИИ-автоматизации продаж: посетитель общается голосом/текстом с
ИИ-менеджером (Dasha) и в реальном времени видит, как разговор заносится в макет CRM,
формируется авто-саммари, считается экономика (ROI). Двойная роль: лидген на сайте +
демо-инструмент на встречах. Продающий актив для всех сделок по ИИ-автоматизации.

## Запуск
```bash
npm install
npm run dev:backend     # :8080
npm run dev:frontend    # :5173
# Открывать: http://localhost:5173/?presenter=change-me  (презентер = без гейта/лимитов)
```
Без `DASHA_API_KEY` фронт работает в режиме **simulator** (скриптованный диалог из
`frontend/src/config/niches.ts`). Конфиг — `backend/.env` (см. `backend/.env.example`).

## Стек и структура
- `frontend/` — React+TS+Vite+Tailwind+Zustand. Весь демо-цикл во фронте.
- `backend/` — Fastify+TS. Минт токенов Dasha (держит API-ключ), лимиты/антиспам,
  лид→Supabase, раздача статики. Грузит `.env` через `process.loadEnvFile()`.
- `dasha-setup/` — артефакты для настройки агента Dasha (промпты, tools.json, зонд, SETUP).

## Главный принцип
Dasha ведёт разговор. «Магию» (заполнение карточки, саммари, скоринг, SMS, перезвон, ROI)
рисует **браузер** через **client-side tools** поверх websocket Dasha — без бэкенд-хопа.

## Dasha BlackBox — подтверждённый протокол (проверено живьём)
- WS: `wss://blackbox.dasha.ai/api/v1/ws/webCall?token={integration_token}`.
  (dev-эндпоинт `ws/dev?authorization=` НЕ работает — давал 1006.)
- `initialize`: `{type:'initialize', timestamp, request:{callType:'chat'|'webCall', additionalData:{sessionId,niche,mode}}}`.
  **callType выбирается на фронте по виджету** (голос→webCall, текст→chat), см. `useSandbox.ts`.
- Текст: `incomingChatMessage.content` — **строка** (не объект, иначе close 1007).
- Реплики приходят `type:'text'`, `content={source:'assistant'|'user', text, ...}`. Рендерим только `assistant`. В голосе транскрипт не показываем.
- Tools: сервер шлёт `websocketToolRequest {content:{id,toolName,args}}` → фронт исполняет → `websocketToolResponse`.
  **Ответ ОБЯЗАН содержать `channelId` (nullable → слать `null`)** + `content:{id,result}`, иначе 1007.
- Client-side tools включаются списком **имён в поле `tools` web-интеграции** (`WebIntegrationRequestDto.tools`). Пусто → все server-side (LlmTool.webhook, HTTP).
- Голос (WebRTC): offer приходит в `sdpInvite.data.invite` (сырой SDP, SIP/pjmedia, профиль RTP/SAVP, G.711 — Chrome принимает). Answer слать `{type:'sdpAnswer', channelId:null, data:{sdpAnswer:<sdp>}}`. Offer без trickle → дождаться `icegatheringstate==='complete'` (см. `DashaClient.waitIceGathering`). В конце звонка ws закрывается 1006 — безвредно.
- `conversationResult` от сервера = авто-саммари.
- REST-авторизация: `Authorization: Bearer <key>`. Токен: `POST /api/v1/web-integrations/{id}/tokens {name УНИКАЛЬНО!}` → `{token}` (дубль name → 409).
- Длительность звонков: `POST /api/v1/callresults/search` → поле `durationSeconds` (точный замер для биллинга/ROI). Биллинг/тариф API НЕ отдаёт — тариф из дашборда Dasha.

## Контракт client-side tools (зеркало `frontend/src/dasha/tools.ts` ↔ `store.applyTool`)
Общие: `update_card{field,value}` · `set_summary{text}` · `lead_score{score,sentiment}` ·
`show_sms{text,link}` · `request_callback{delaySeconds,reason}` · `transfer{reason}`.
Услуги: `book_appointment{day,time,service,client,master}` → заполняет календарь + поля «Запись»/«Мастер».
Еда: `add_order_item{name,price,qty}` (корзина) · `place_order{deliveryTime}` (история заказов + бонусы 5%).

## Ниши (NicheConfig.crmView: 'calendar' для услуг, 'order' для еды)
`salon` (дефолт, ЖИВОЙ Dasha, calendar) · `food` (ЖИВОЙ Dasha, order) · `dental`/`auto`/`meat` (simulator, calendar).
Каждая = свои поля карточки, ROI-параметры, скриптованный сценарий. Внизу витрины App рендерит
Calendar (записи) или OrderBoard (корзина+история+бонусы) по crmView.

## Ресурсы Dasha (на аккаунте клиента; API-ключ только в backend/.env, НЕ в репозитории)
- salon-агент: `9839c486-f904-4db4-9d66-228964d76580` (ru-RU, ElevenLabs, gpt-4.1-mini, промпт+прайс+7 tools)
- salon web-integration: `c00710b5-5214-4988-b5b3-30a0dae8c5e6` (пересоздавалась; старая 12acd268 удалена)
- food-агент: `99b72ae5-61f2-4bd0-80dc-6c6a9809ac67` (меню+цены, 8 tools, без book_appointment)
- food web-integration: `ae156a37-da05-4a44-bac9-a6e65cbbfd80`
- orgId: `133a8968-e176-4810-9d2e-f6cf0fe8f98d`. Дефолтный онбординг-агент `5041527b…` НЕ трогаем.
- Обновление агента: `PUT /api/v1/agents/{id}`. Обновление интеграции: PUT коллекции капризен → DELETE+POST (меняет id → правь .env).

## Телефония (реальный телефон) — В РАБОТЕ, не закончено
- У каждого агента Dasha есть входящий SIP-URI (inboundSipConfig.sipUri): салон `sip:e1a10fe7-…@sip.us.dasha.ai`,
  еда `sip:edfc6ee6-…@sip.us.dasha.ai`. ⚠️ Endpoint в США (sip.us.dasha.ai) — латентность на РФ-звонках.
- Dasha provider-интеграции: Twilio (родная, 2 мин, но не +7), Vonage, Telnyx + любой SIP по credentials
  (server/authUser/authPassword/domain/transport). Свои номера Dasha не продаёт.
- Voximplant (creds в .env): аккаунт RUR, активен, НО 0 номеров, 0 Caller ID, баланс ~46₽, API-ключ
  без прав на AddCallerID («Forbidden command»). Сценарий-мост готов: `voximplant/inbound-bridge.js`.
  Тест-звонок (outbound→телефон+bridge к Dasha SIP) упал: `Authorization failed` (нет Caller ID).
  Блокеры: нужен арендованный DID (для входящих) ИЛИ verified Caller ID в панели (для исходящего теста) + пополнение баланса.

## Статус
Салон+еда работают end-to-end в браузере (голос+чат+tools+CRM+календарь/корзина+история+бонусы+SMS+перезвон+прайс/меню), проверено вживую.
Дальше: телефония (см. выше); агенты dental/auto/meat по образцу; деплой на `demo.flowsmart.ru`
(pm2 + Caddy на Hostkey 194.34.239.230); публичный режим + Supabase для лидов.

## Гочи
- Запуск нового разговора глушит предыдущий (без двойных звонков); перезвон всплывает только после завершения текущего звонка.
- Презентер-режим: `?presenter=<PRESENTER_KEY>` — снимает гейт и лимиты.
- Сумму заказа/доставку считает UI (источник истины); агент устно может ошибаться.
- Агент дробит реплики (для TTS) → в чате склеиваем подряд идущие реплики ассистента; «um» вырезаем на клиенте.
