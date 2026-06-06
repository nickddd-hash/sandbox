# Подключение Dasha BlackBox к песочнице

Что нужно сделать на стороне Dasha (дашборд + API-ключ) и как связать с приложением.

## Шаг 1. Аккаунт и API-ключ
1. Зарегистрируйся/войди на https://blackbox.dasha.ai
2. Получи **API-ключ** (Settings / API keys). Держать только на сервере — в `backend/.env`.

## Шаг 2. Зонд (проверка до настройки агентов)
Проверь, что ключ и websocket живые, и сними форматы сообщений:
```bash
node dasha-setup/dasha-ping.mjs <DASHA_API_KEY> dental
```
В выводе смотрим реальные `type` сообщений и форму `websocketToolRequest` / `sdpInvite`.
Если поля отличаются от наших — поправим `frontend/src/dasha/DashaClient.ts` (помечено TODO).

## Шаг 3. Агент(ы)
Два варианта (см. вопрос в чате):
- **A. Один агент на все ниши** — проще. Персона/ниша приходит в `additionalData.niche`,
  в промпте: «определи нишу по additionalData и веди себя соответственно». 1 интеграция.
- **B. Четыре агента (по нише)** — чище: своя База знаний и поля на нишу. 4 интеграции.

Для каждого агента:
1. **System Prompt** — взять из `dasha-setup/prompts.md` (общие правила + блок ниши).
2. **Язык** — русский. **Голос** — ElevenLabs/Cartesia, русскоязычный, скорость ~1.0.
3. **LLM** — например GPT-4.1-mini, temperature ~0.3.
4. **Tools** — добавить 6 инструментов из `dasha-setup/tools.json` как **client-side
   (websocket) tools** (исполняются на стороне клиента, не серверный webhook).
5. (Опц.) **Knowledge Base** — загрузить документы по услугам ниши.

## Шаг 4. Web Integration → integrationId
1. Создай **Web Integration** для агента (Deploy → Web).
2. Скопируй **integrationId**.
3. Вариант B — повтори для всех 4 ниш.

## Шаг 5. Конфиг приложения
В `backend/.env`:
```
DASHA_API_KEY=<ключ>
DASHA_INTEGRATION_DENTAL=<integrationId стоматологии>
DASHA_INTEGRATION_AUTO=<...>
DASHA_INTEGRATION_MEAT=<...>
DASHA_INTEGRATION_SALON=<...>
```
Вариант A (один агент) — впиши один и тот же integrationId во все четыре переменные.

## Шаг 6. Запуск и проверка
```bash
npm run dev:backend
npm run dev:frontend
```
- `GET /api/health` → `"dasha":"enabled"`.
- На фронте жмём «Позвонить»: `session/start` вернёт `transport:"dasha"`, браузер откроет
  websocket Dasha, пойдёт WebRTC-голос, агент начнёт звать `update_card` → карточка заполняется.
- Браузер запросит доступ к микрофону (нужен HTTPS или localhost).

## Известные места под доводку (после зонда)
- Точные поля WebRTC: `sdpInvite.content` (offer) и форма `sdpAnswer` — подтвердить по выводу зонда/доке.
- Имя поля резюме в `conversationResult` — подтвердить и поправить маппинг в `DashaClient`.
