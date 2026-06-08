#!/usr/bin/env node
// Проверяет, как RU-сервер реагирует на sdpAnswer с разными channelId.
// Шлём структурно-валидный answer SDP (медиа не поедет без реального DTLS,
// но сигналинг/валидацию channelId сервер отработает и закроется с причиной).
//   node dasha-setup/voice-answer-probe.mjs <channelIdMode: null|empty|jobid>
const mode = process.argv[2] || 'null';

const s = await (await fetch('http://localhost:8080/api/session/start', {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ niche: 'lendauto', presenterKey: 'change-me' }),
})).json();

let jobId = null;
const ws = new WebSocket(s.dasha.wsUrl);
const send = (o) => { console.log('→', o.type, 'channelId=' + JSON.stringify(o.channelId)); ws.send(JSON.stringify(o)); };

const answerSdp = [
  'v=0', 'o=- 4611731400430051336 2 IN IP4 127.0.0.1', 's=-', 't=0 0',
  'a=group:BUNDLE 0', 'a=msid-semantic: WMS',
  'm=audio 9 UDP/TLS/RTP/SAVP 0 8 120', 'c=IN IP4 0.0.0.0',
  'a=rtcp:9 IN IP4 0.0.0.0', 'a=ice-ufrag:te57', 'a=ice-pwd:9MBVepHydMxq6Cup5GhZ8abc',
  'a=fingerprint:sha-256 11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00:11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00',
  'a=setup:active', 'a=mid:0', 'a=rtcp-mux',
  'a=rtpmap:0 PCMU/8000', 'a=rtpmap:8 PCMA/8000',
  'a=rtpmap:120 telephone-event/8000', 'a=fmtp:120 0-16', 'a=sendrecv',
].join('\r\n') + '\r\n';

ws.addEventListener('open', () => {
  console.log('✓ ws открыт, mode=' + mode);
  send({ type: 'initialize', timestamp: new Date().toISOString(), request: { callType: 'webCall', additionalData: { sessionId: s.sessionId, niche: 'lendauto', mode: 'presenter' } } });
});
ws.addEventListener('message', (ev) => {
  const m = JSON.parse(ev.data);
  if (m.type === 'event' && m.name === 'connection') jobId = m.data?.jobId;
  if (m.type === 'event') { console.log('· event', m.name, 'channelId=' + JSON.stringify(m.channelId)); return; }
  if (m.type === 'sdpInvite') {
    console.log('← sdpInvite получен, шлю sdpAnswer…');
    const channelId = mode === 'empty' ? '' : mode === 'jobid' ? jobId : null;
    send({ type: 'sdpAnswer', timestamp: new Date().toISOString(), channelId, data: { sdpAnswer: answerSdp } });
    return;
  }
  if (m.type === 'error') { console.log('❌ ERROR:', m.data?.message); return; }
  if (m.type === 'conversationResult') { console.log('RESULT:', m.result?.status, '|', m.result?.errorMessage ?? '—'); return; }
  console.log('←', m.type, JSON.stringify(m).slice(0, 160));
});
ws.addEventListener('close', (e) => { console.log('✗ CLOSE code=', e.code, 'reason=', JSON.stringify(e.reason)); process.exit(0); });
setTimeout(() => ws.close(), 10000);
