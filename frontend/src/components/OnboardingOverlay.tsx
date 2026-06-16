import { useState, useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
}

const SLIDES = [
  {
    icon: '✦',
    title: 'Что это такое?',
    desc: 'Живая демонстрация ИИ-менеджера отдела продаж. Здесь можно попробовать: как он принимает звонки, ведёт диалог, заполняет CRM и передаёт заявку в работу — всё в реальном времени.',
  },
  {
    icon: '🏪',
    title: 'Выберите нишу',
    desc: '8 сценариев на выбор: прокат авто, салон красоты, доставка еды, магазин цветов, недвижимость, стоматология, автосервис, мясная продукция. У каждой ниши свой агент, своя логика диалога и структура CRM.',
  },
  {
    icon: '🎙️',
    title: 'Голос или чат — на ваш выбор',
    desc: 'Нажмите «Звонок» — ИИ-менеджер ответит голосом прямо в браузере. Или «Чат» — общайтесь текстом. Оба режима ведут полноценный диалог вплоть до оформления заявки.',
  },
  {
    icon: '📋',
    title: 'CRM заполняется сама',
    desc: 'Агент в реальном времени вытаскивает из разговора имя, телефон, услугу, дату — и записывает в карточку лида. После завершения — авто-саммари и скоринг: горячий, тёплый или новый лид.',
  },
  {
    icon: '📅',
    title: 'Календарь, доска, корзина',
    desc: 'В зависимости от ниши появляется нужный виджет: запись в календарь для салона и клиники, доска бронирования для проката авто, корзина заказа для доставки. Всё — в реальном времени.',
  },
  {
    icon: '👷',
    title: 'Наряд исполнителю',
    desc: 'Оформленная заявка сразу попадает в панель исполнителя. Повар и курьер видят заказ. Флорист — состав букета. Мастер — клиента и услугу. Риэлтор — детали осмотра. Механик — авто и работу.',
  },
];

export function OnboardingOverlay({ open, onClose }: Props) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (open) setStep(0); }, [open]);
  const total = SLIDES.length;
  const slide = SLIDES[step];
  const isLast = step === total - 1;

  if (!open) return null;

  const goNext = () => (isLast ? onClose() : setStep((s) => s + 1));
  const goPrev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="onboard-overlay" onClick={onClose}>
      <div className="onboard-card" onClick={(e) => e.stopPropagation()}>

        {/* Шапка — постоянная */}
        <div className="onboard-head">
          <div className="onboard-mark">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="4.5" fill="#fff" />
              <circle cx="14" cy="14" r="9" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
            </svg>
          </div>
          <h2 className="onboard-title">Тестовый отдел продаж</h2>
          <p className="onboard-sub">ИИ-консультант · демо-песочница</p>
        </div>

        {/* Слайд */}
        <div key={step} className="onboard-slide">
          <div className="onboard-icon">{slide.icon}</div>
          <div className="onboard-slide-title">{slide.title}</div>
          <p className="onboard-slide-desc">{slide.desc}</p>
        </div>

        {/* Навигация */}
        <div className="onboard-nav">
          <div className="onboard-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={'onboard-dot' + (i === step ? ' onboard-dot--on' : '')}
                onClick={() => setStep(i)}
                aria-label={`Шаг ${i + 1}`}
              />
            ))}
          </div>
          <div className="onboard-btns">
            {step > 0 && (
              <button className="onboard-btn onboard-btn--ghost" onClick={goPrev}>
                ← Назад
              </button>
            )}
            <button className={'onboard-btn' + (isLast ? ' onboard-btn--cta' : '')} onClick={goNext}>
              {isLast ? 'Попробовать →' : 'Далее →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
