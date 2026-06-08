/**
 * VoxEngine-сценарий: callback — сервер звонит пользователю и соединяет с Dasha.
 *
 * Поток: backend вызывает StartScenarios → сценарий принимает customData →
 * звонит пользователю callPSTN → когда пользователь берёт трубку → звонит Dasha callSIP →
 * мост easyProcess. sessionId передаётся Dasha через SIP-заголовок X-Session-Id
 * (нужно сопоставить в настройках агента Dasha: additionalData.sessionId ← X-Session-Id).
 *
 * Загрузить в Voximplant: приложение sandbox → Сценарии → dasha-bridge-test → заменить код.
 */

VoxEngine.addEventListener(AppEvents.Started, function () {
  var data = {};
  try { data = JSON.parse(VoxEngine.customData() || '{}'); } catch (e) {}

  var phone = data.phone;
  var sip = data.sip;
  var cid = data.callerid || phone;
  var sessionId = data.sessionId || '';

  Logger.write('CALLBACK start phone=' + phone + ' sip=' + sip + ' sessionId=' + sessionId);

  var user = VoxEngine.callPSTN(phone, cid);

  user.addEventListener(CallEvents.Connected, function () {
    Logger.write('USER connected -> dial Dasha sessionId=' + sessionId);

    var dasha = VoxEngine.callSIP(sip, {
      callerid: cid,
      displayName: cid,
      // sessionId для Dasha: будет в additionalData если агент настроен читать X-Session-Id
      extraHeaders: { 'X-Session-Id': sessionId },
    });

    dasha.addEventListener(CallEvents.Connected, function () {
      Logger.write('DASHA connected');
    });
    dasha.addEventListener(CallEvents.Failed, function (e) {
      Logger.write('DASHA FAILED ' + e.code + ' ' + e.reason);
      VoxEngine.terminate();
    });

    VoxEngine.easyProcess(user, dasha, function () { Logger.write('BRIDGED'); }, true);
  });

  user.addEventListener(CallEvents.Failed, function (e) {
    Logger.write('USER FAILED ' + e.code + ' ' + e.reason);
    VoxEngine.terminate();
  });
  user.addEventListener(CallEvents.Disconnected, function () {
    VoxEngine.terminate();
  });
});
