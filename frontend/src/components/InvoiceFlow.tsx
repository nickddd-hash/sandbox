import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { formatRub } from '../roi';

export function InvoiceFlow() {
  const payment = useStore((s) => s.card.payment?.value);
  const card    = useStore((s) => s.card);
  const order   = useStore((s) => s.order);
  const history = useStore((s) => s.orderHistory);
  const niche   = useStore((s) => s.niche);

  const isInvoice = !!payment && /счёт|счет|безнал/i.test(payment);

  const [phase, setPhase]       = useState<'idle' | 'processing' | 'ready'>('idle');
  const [fileName, setFileName] = useState('');
  const invoiceNum = useRef(`${Math.floor(1000 + Math.random() * 9000)}`).current;
  const today = new Date().toLocaleDateString('ru-RU');

  useEffect(() => {
    if (!isInvoice) { setPhase('idle'); setFileName(''); }
  }, [isInvoice]);

  if (!isInvoice) return null;

  const company = card.company?.value || card.name?.value || 'Клиент';
  const placed  = history[history.length - 1];
  const items   = order.length > 0 ? order : (placed?.items ?? []);
  const total   = order.reduce((s, i) => s + i.price * i.qty, 0) || placed?.total || 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setPhase('processing');
    setTimeout(() => setPhase('ready'), 2400);
  };

  const handleDownload = () => {
    const rows = items
      .map(
        (i) =>
          `<tr><td>${i.name}</td>` +
          `<td style="text-align:center">${i.qty}&nbsp;${(i as { unit?: string }).unit || 'шт'}</td>` +
          `<td style="text-align:right">${formatRub(i.price)}</td>` +
          `<td style="text-align:right;font-weight:600">${formatRub(i.price * i.qty)}</td></tr>`,
      )
      .join('');

    const html = `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"><title>Счёт №${invoiceNum}</title>
<style>
  body{font-family:Arial,sans-serif;max-width:780px;margin:48px auto;color:#1a1a1a;font-size:14px}
  h2{margin:0 0 4px;font-size:20px}
  .sub{color:#666;margin:0 0 28px;font-size:13px}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-bottom:24px}
  .party-label{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#999;margin-bottom:4px}
  .party-val{font-weight:600}
  .party-meta{font-size:12px;color:#666;margin-top:2px}
  table{width:100%;border-collapse:collapse;margin:0 0 20px}
  th,td{border:1px solid #e0e0e0;padding:9px 12px}
  th{background:#f6f7f9;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#555}
  .foot-row td{background:#eef2ff;font-weight:700}
  .stamp{color:#4f46e5;font-size:12px;margin-top:28px;padding-top:12px;border-top:1px solid #e0e0e0}
</style></head><body>
<h2>Счёт на оплату № ${invoiceNum}</h2>
<p class="sub">Дата: ${today}</p>
<div class="parties">
  <div>
    <div class="party-label">Поставщик</div>
    <div class="party-val">${niche.label}</div>
    <div class="party-meta">ИНН 7700000000 · КПП 770001001<br>р/с 40702810000000000001 в Банке</div>
  </div>
  <div>
    <div class="party-label">Покупатель</div>
    <div class="party-val">${company}</div>
    ${fileName ? `<div class="party-meta">Реквизиты из файла: ${fileName}</div>` : ''}
  </div>
</div>
<table>
  <thead><tr><th>Наименование</th><th>Кол-во</th><th>Цена</th><th>Сумма</th></tr></thead>
  <tbody>${rows}</tbody>
  <tfoot><tr class="foot-row">
    <td colspan="3">ИТОГО к оплате (без НДС)</td>
    <td style="text-align:right">${formatRub(total)}</td>
  </tr></tfoot>
</table>
<div class="stamp">✅ Документ сформирован автоматически · ${new Date().toLocaleString('ru-RU')}</div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Счёт_${invoiceNum}_${today.replace(/\./g, '-')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="card invoice-flow">
      <header className="board-head">
        <h3 className="board-title">
          <span style={{ fontSize: 16 }}>📄</span>
          Счёт на оплату
        </h3>
        <span className="naryad-tag">автобухгалтерия</span>
      </header>

      {phase === 'idle' && (
        <div className="invoice-body">
          <p className="invoice-hint">
            Клиент выбрал оплату по счёту. Загрузите реквизиты компании — система
            сформирует счёт и передаст в 1С автоматически.
          </p>
          <label className="invoice-upload">
            <span className="invoice-upload-ico">⬆</span>
            <span>
              Загрузить реквизиты компании
              <br />
              <small>PDF, DOCX, JPG — до 10 МБ</small>
            </span>
            <input
              type="file"
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
              style={{ display: 'none' }}
              onChange={handleFile}
            />
          </label>
          <button
            className="invoice-demo-btn"
            onClick={() => { setFileName('Реквизиты_компании.pdf'); setPhase('processing'); setTimeout(() => setPhase('ready'), 2400); }}
          >
            Показать демо (без файла)
          </button>
        </div>
      )}

      {phase === 'processing' && (
        <div className="invoice-body">
          <div className="invoice-status-row">
            <span className="invoice-spin" />
            <span>
              Реквизиты получены (<b>{fileName}</b>)
            </span>
          </div>
          <div className="invoice-status-row" style={{ marginTop: 8, color: 'var(--text-2)' }}>
            <span className="invoice-spin" />
            <span>Передаём данные в 1С: Бухгалтерия…</span>
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <div className="invoice-body">
          <div className="invoice-ready-banner">
            <span className="invoice-ready-ico">✓</span>
            <div>
              <div className="invoice-ready-title">
                Счёт №&nbsp;{invoiceNum} от {today} сформирован
              </div>
              <div className="invoice-ready-sub">
                1С: Бухгалтерия подтвердила создание документа
              </div>
            </div>
          </div>
          <button className="invoice-dl-btn" onClick={handleDownload}>
            ⬇&nbsp; Скачать счёт
          </button>
        </div>
      )}
    </section>
  );
}
