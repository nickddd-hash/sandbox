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

## Платформы Dasha
- **Российская (активная)**: `blackbox.ru.dasha.ai` / `sip.ru.dasha.ai` — Яндекс.Облако. API-ключ `LGLb4oe...` в `backend/.env`. Агенты lendauto живут здесь.
- **Международная (старая)**: `blackbox.dasha.ai` / `sip.us.dasha.ai` — агенты salon/food **пока там**, нужна миграция (потребует нового API-ключа от клиента с RU-аккаунта).
- `DASHA_BASE_URL` в `.env` определяет какую платформу использует бэкенд для минтинга токенов.

## Dasha BlackBox — подтверждённый протокол (проверено живьём)
- WS: `wss://blackbox.ru.dasha.ai/api/v1/ws/webCall?token={integration_token}` (RU-платформа; US: `blackbox.dasha.ai`).
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
Услуги: `book_appointment{day,time,service,client,master}` → заполняет Calendar.
Еда: `add_order_item{name,price,qty}` (корзина) · `place_order{deliveryTime}` (история заказов + бонусы 5%).
Прокат: `check_availability{car,dateFrom,dateTo}` → подсвечивает строку в RentalBoard + возвращает available.
         `book_car{car,dateFrom,dateTo,client,city}` → добавляет бронь в RentalBoard (зелёная ячейка).

## Ниши (NicheConfig.crmView: 'calendar' | 'order' | 'rental')
`lendauto` (дефолт, ЖИВОЙ Dasha RU, rental) · `salon` (ЖИВОЙ Dasha US→нужна миграция, calendar) ·
`food` (ЖИВОЙ Dasha US→нужна миграция, order) · `dental`/`auto`/`meat` (simulator, calendar).
App рендерит: `rental` → RentalBoard · `order` → OrderBoard · `calendar` → Calendar.

## Ресурсы Dasha — RU-платформа (`blackbox.ru.dasha.ai`)
- lendauto-агент: `b37dfcf5-3701-432f-b5a0-305b84dcc266` (ru-RU, Cartesia, gpt-4.1-mini, 8 tools)
- lendauto web-integration: `cdffa5fe-36da-4fe4-af3a-58a6b0ccc339`
- **Промпт агента — вставить из `dasha-setup/prompts.md` → раздел «Прокат автомобилей»**

## Ресурсы Dasha — US-платформа (`blackbox.dasha.ai`) — УСТАРЕВАЕТ
- salon-агент: `9839c486-f904-4db4-9d66-228964d76580` (ElevenLabs, 7 tools)
- salon web-integration: `c00710b5-5214-4988-b5b3-30a0dae8c5e6`
- food-агент: `99b72ae5-61f2-4bd0-80dc-6c6a9809ac67`
- food web-integration: `ae156a37-da05-4a44-bac9-a6e65cbbfd80`
- orgId US: `133a8968-e176-4810-9d2e-f6cf0fe8f98d`
- Обновление агента: `PUT /api/v1/agents/{id}`. Обновление интеграции: DELETE+POST (меняет id → правь .env).

## Телефония (реальный телефон) — ИНФРАСТРУКТУРА ГОТОВА

### Что сделано (2026-06-08)
- **Тест входящего звонка прошёл**: Voximplant тестовый номер `699311312` (страна «Тестовые, Rivendell», активен до 02.07.2026) → `voximplant/inbound-bridge.js` → Dasha SIP → агент ответил. Работает!
  - Позвонить на тестовый номер: набрать `+74999384362`, после соединения ввести `699311312`
- **CallbackWidget добавлен на страницу**: поле «Введите номер» → кнопка «Позвонить» → backend вызывает Voximplant StartScenarios → Voximplant звонит пользователю → мост к Dasha
- **CRM во время звонка**: backend `/api/tool-event` (Dasha webhook) + SSE `/api/session/:id/events` → фронт применяет tool-события в стор (тот же `applyTool`)
- **Voximplant сценарий** `voximplant/callback-bridge.js` передаёт `sessionId` в Dasha через SIP-заголовок `X-Session-Id`

### Что ещё нужно настроить (блокеры)
1. **`backend/.env`** — заполнить:
   ```
   VOXIMPLANT_ACCOUNT_ID=<account_id из панели Voximplant>
   VOXIMPLANT_API_KEY=<API-ключ>
   VOXIMPLANT_CALLERID=<номер-отправитель, сейчас 699311312 для теста>
   ```
2. **Voximplant** — заменить содержимое сценария `dasha-bridge-test` кодом из `voximplant/callback-bridge.js`
3. **Dasha агент (salon)** — для CRM при телефонном звонке настроить webhook-инструменты:
   - URL: `https://demo.flowsmart.ru/api/tool-event?session={{additionalData.sessionId}}`
   - Сопоставить SIP-заголовок `X-Session-Id` → `additionalData.sessionId` в inbound SIP конфиге агента
4. **Для callback на реальные номера** — нужен верифицированный Caller ID (или купить DID ~30-100₽/мес). Тестовый `699311312` только для входящих (callPSTN на него не работает).

### Промпты агента (обновлено 2026-06-08)
- Карина теперь всегда начинает: **«Салон красоты "Шарм", администратор Карина, здравствуйте!»**
- Запрет `um`/`uh` → заменено на: хорошо, поняла, минутку, ясно, отлично
- **→ Нужно вручную вставить обновлённый промпт из `dasha-setup/prompts.md` в Dasha Dashboard**

## Деплой (прод) — ЖИВОЙ
- **URL: https://sandbox.flowsmart.ru** (НЕ demo!). VPS Hostkey `194.34.239.230`, каталог **`/root/sandbox`** (это НЕ git-репозиторий — выкладка через scp), pm2-процесс **`sandbox-backend`** = `npx tsx backend/src/server.ts`, **PORT=3011**, `STATIC_DIR=/root/sandbox/frontend/dist`, за Caddy (в контейнере).
- **Процесс:** git-first (push в GitHub) → `npm run build --workspace=frontend` локально → scp `backend/src` и `frontend/dist` в `/root/sandbox` → **ОБЯЗАТЕЛЬНО `pm2 restart sandbox-backend`** (Fastify-статика индексирует файлы при старте; без рестарта новый бандл не отдаётся → белый экран).
- SSH: `ssh -i ~/.ssh/hostkey_main_ed25519 root@194.34.239.230`. `backend/.env` на сервере — отдельный (свои PORT/STATIC_DIR/ключи); правки .env только surgical (бэкап + append), не перезатирать.

## Текстовый чат — через Hubris (НЕ Dasha)
- Чат идёт `backend/src/routes/chat.ts` → прокси `api.hubris.pw` (OpenAI-совместимый, ключ `HUBRIS_API_KEY`, модель `HUBRIS_MODEL` в .env). Параметризован по нише (lendauto / meat).
- Модель чата — **`google/gemini-2.5-flash`** (на проде грузится `/root/sandbox/.env` без `HUBRIS_MODEL` → дефолт кода; полный flash function-calling тянет, flash-LITE — нет). Задаётся `HUBRIS_MODEL` в .env. Голос — отдельно, через Dasha-агента (lendauto, `gemini-2.5-flash-lite`).

## Статус (2026-06-10)
✅ Прод живой на https://sandbox.flowsmart.ru (браузер: голос+чат+CRM+order/rental/calendar, end-to-end).
✅ Ниша lendauto: живой Dasha RU (голос+чат), агент `gemini-2.5-flash-lite`.
✅ Ниша **Meat Foods** (бывш. `meat`): order-демо, текстовый чат ЖИВОЙ (Ольга, ассортимент meatfoods.ru, позиции с кг/ценой за кг, вес заказа, доставка от 15 кг, валидация телефона, обращение на «Вы», оплата нал/безнал). Голос — пока simulator (Dasha-агента для meat нет).
🚧 Голосовой Dasha-агент Meat Foods — не создан.
🚧 Salon/food агенты — пока на US-платформе; нужна миграция на RU.
🚧 Второй виджет на Яндексе (AI Studio Realtime) — ждёт Folder ID (нет баланса на Yandex Cloud).
🚧 Телефония lend-auto.ru: Megafon ВАТС → Voximplant → Dasha SIP (архитектура готова, нужны ключи/Caller ID).
🚧 Публичный режим + Supabase для лидов.

## Гочи
- Запуск нового разговора глушит предыдущий (без двойных звонков); перезвон всплывает только после завершения текущего звонка.
- Презентер-режим: `?presenter=<PRESENTER_KEY>` — снимает гейт и лимиты.
- Сумму заказа/доставку считает UI (источник истины); агент устно может ошибаться.
- Агент дробит реплики (для TTS) → в чате склеиваем подряд идущие реплики ассистента; «um» вырезаем на клиенте.
