interface Props {
  open: boolean;
  onClose: () => void;
}

const STEPS = [
  {
    num: 1,
    title: 'Выберите нишу',
    desc: 'Прокат авто, салон красоты, доставка еды — у каждой свой агент и своя CRM-карточка.',
  },
  {
    num: 2,
    title: 'Позвоните или напишите',
    desc: 'Нажмите «Звонок» — агент ответит голосом. Или «Чат» — общайтесь текстом.',
  },
  {
    num: 3,
    title: 'Следите за CRM',
    desc: 'Имя, услуга, дата, скоринг — карточка заполняется сама, прямо во время разговора.',
  },
];

export function OnboardingOverlay({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="onboard-overlay" onClick={onClose}>
      <div className="onboard-card" onClick={(e) => e.stopPropagation()}>
        <div className="onboard-head">
          <div className="onboard-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="4.5" fill="#fff" />
              <circle cx="14" cy="14" r="9" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="onboard-title">Тестовый отдел продаж</h2>
          <p className="onboard-sub">Живая демонстрация ИИ-автоматизации</p>
        </div>

        <div className="onboard-steps">
          {STEPS.map((s) => (
            <div key={s.num} className="onboard-step">
              <span className="onboard-num">{s.num}</span>
              <div>
                <div className="onboard-step-title">{s.title}</div>
                <div className="onboard-step-desc">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <button className="onboard-cta" onClick={onClose}>
          Попробовать →
        </button>
      </div>
    </div>
  );
}
