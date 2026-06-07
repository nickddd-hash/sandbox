/**
 * VoxEngine-сценарий: мост «входящий звонок на номер Voximplant → SIP-агент Dasha».
 *
 * Поток: абонент звонит на номер Voximplant → срабатывает rule этого приложения →
 * сценарий принимает входящий вызов и соединяет его с SIP-URI агента Dasha.
 *
 * Подключение:
 *  1. Voximplant → создать/выбрать приложение, загрузить этот сценарий, создать rule
 *     (rule_pattern = ".*"), привязать к приложению.
 *  2. Привязать арендованный номер к этому приложению/правилу.
 *  3. Позвонить на номер — ответит агент Dasha.
 *
 * Один номер = один агент. Чтобы переключить нишу — поменяй DASHA_SIP ниже
 * (или сделай IVR: по нажатию клавиши выбирать салон/еду).
 */

// SIP-URI агентов Dasha (inboundSipConfig.sipUri):
const AGENTS = {
  salon: 'sip:e1a10fe7-5763-4aea-8fc7-eaa6c1edc597@sip.us.dasha.ai',
  food: 'sip:edfc6ee6-dfc0-480b-a3c0-3a23f4d54ba7@sip.us.dasha.ai',
};

// Какой агент отвечает на этот номер:
const DASHA_SIP = AGENTS.salon;

VoxEngine.addEventListener(AppEvents.CallAlerting, (e) => {
  // Звоним SIP-агенту Dasha, прокидывая идентификацию входящего вызова.
  const outbound = VoxEngine.callSIP(DASHA_SIP, {
    callerid: e.callerid,
    displayName: e.displayName || e.callerid,
  });

  // easyProcess: отвечает на входящий, дожидается соединения с агентом,
  // сводит аудио и корректно завершает сессию при разрыве любой из сторон.
  VoxEngine.easyProcess(e.call, outbound, () => {}, true);
});
