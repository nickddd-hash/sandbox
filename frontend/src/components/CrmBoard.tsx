import { useStore } from '../store';
import { LeadCard } from './LeadCard';

// Имитация SMS, «прилетевшей» клиенту.
function SmsMock() {
  const sms = useStore((s) => s.sms);
  if (!sms) return null;
  return (
    <div className="rounded-xl border border-emerald-700/50 bg-emerald-950/30 p-4">
      <div className="text-xs uppercase tracking-wide text-emerald-400 mb-2">📱 SMS отправлено</div>
      <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-100">
        {sms.text}{' '}
        <a className="text-emerald-400 underline break-all" href="#" onClick={(e) => e.preventDefault()}>
          {sms.link}
        </a>
      </div>
    </div>
  );
}

// Баннер перевода на живого оператора.
function TransferBanner() {
  const reason = useStore((s) => s.transferReason);
  if (!reason) return null;
  return (
    <div className="rounded-xl border border-violet-700/50 bg-violet-950/30 p-4">
      <div className="text-xs uppercase tracking-wide text-violet-300 mb-1">↪ Перевод на оператора</div>
      <p className="text-sm text-slate-200">{reason}</p>
    </div>
  );
}

export function CrmBoard() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-lg">🗂️</span>
        <h2 className="text-base font-semibold">CRM · Сделки</h2>
        <span className="ml-2 text-xs text-slate-500">демо-витрина</span>
      </div>
      <LeadCard />
      <SmsMock />
      <TransferBanner />
    </section>
  );
}
