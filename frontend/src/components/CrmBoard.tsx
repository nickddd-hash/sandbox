import { useStore } from '../store';

function scoreClass(score: number) {
  if (score >= 70) return 'lead-pill--hot';
  if (score >= 40) return 'lead-pill--warm';
  return 'lead-pill--cold';
}

function scoreLabel(score: number) {
  if (score >= 70) return 'Горячий лид';
  if (score >= 40) return 'Тёплый лид';
  return 'Новый лид';
}

export function CrmBoard() {
  const niche = useStore((s) => s.niche);
  const card = useStore((s) => s.card);
  const summary = useStore((s) => s.summary);
  const score = useStore((s) => s.score);
  const sms = useStore((s) => s.sms);
  const transferReason = useStore((s) => s.transferReason);

  const filledCount = niche.fields.filter((f) => card[f.key]).length;
  const pct = niche.fields.length ? Math.round((filledCount / niche.fields.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap)' }}>
      <section className="card">
        <header className="card-head">
          <div className="card-eyebrow">
            <span className="dot-folder" />
            CRM · Сделки
            <span className="card-tag">демо-витрина</span>
          </div>
          {score != null && (
            <span className={`lead-pill ${scoreClass(score)}`}>{scoreLabel(score)}</span>
          )}
        </header>

        <div className="crm-card-inner">
          <div className="crm-title-row">
            <h3 className="crm-title">Карточка лида</h3>
            <span className="crm-progress-label">
              {filledCount}/{niche.fields.length} полей
            </span>
          </div>
          <div className="crm-progress">
            <div className="crm-progress-fill" style={{ width: `${pct}%` }} />
          </div>

          <div className="fields">
            {niche.fields.map((f) => {
              const cell = card[f.key];
              const val = cell?.value ?? null;
              return (
                <div key={f.key} className={'field' + (val ? ' field--filled' : '')}>
                  <span className="field-label">{f.label}</span>
                  {val ? (
                    <span key={val} className="field-val field-val--in">{val}</span>
                  ) : (
                    <span className="field-dash">—</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="summary">
            <div className="summary-label">
              <span className="ai-spark" />
              Авто-саммари
            </div>
            {summary ? (
              <p key={summary} className="summary-text summary-text--in">{summary}</p>
            ) : (
              <p className="summary-text summary-text--empty">
                Появится автоматически после разговора — ИИ соберёт суть, статус и следующий шаг.
              </p>
            )}
          </div>
        </div>
      </section>

      {sms && (
        <div className="sms-banner">
          <div className="sms-label">📱 SMS отправлено</div>
          <div className="sms-body">
            {sms.text}{' '}
            <a className="sms-link" href="#" onClick={(e) => e.preventDefault()}>
              {sms.link}
            </a>
          </div>
        </div>
      )}

      {transferReason && (
        <div className="transfer-banner">
          <div className="transfer-label">↪ Перевод на оператора</div>
          <p className="transfer-reason">{transferReason}</p>
        </div>
      )}
    </div>
  );
}
