import { config } from '../config.js';

// SIP-URI агентов Dasha (зеркало voximplant/callback-bridge.js)
const DASHA_SIP: Record<string, string> = {
  salon: 'sip:e1a10fe7-5763-4aea-8fc7-eaa6c1edc597@sip.us.dasha.ai',
  food: 'sip:edfc6ee6-dfc0-480b-a3c0-3a23f4d54ba7@sip.us.dasha.ai',
};

export async function startCallback(phone: string, sessionId: string, niche: string): Promise<void> {
  const sip = DASHA_SIP[niche] ?? DASHA_SIP.salon;

  const customData = JSON.stringify({
    phone,
    sip,
    callerid: config.voximplant.callerId || phone,
    sessionId,
  });

  const params = new URLSearchParams({
    account_id: config.voximplant.accountId,
    api_key: config.voximplant.apiKey,
    application_id: config.voximplant.applicationId,
    scenario_name: config.voximplant.scenarioName,
    script_custom_data: customData,
  });

  const res = await fetch('https://api.voximplant.com/platform_api/StartScenarios/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  const data = await res.json() as { result?: number; error?: { code: number; msg: string } };
  if (data.error) {
    throw new Error(`Voximplant error ${data.error.code}: ${data.error.msg}`);
  }
}
