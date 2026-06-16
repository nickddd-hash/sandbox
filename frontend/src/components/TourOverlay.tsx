import { useState, useEffect } from 'react';

interface TourProps {
  open: boolean;
  onClose: () => void;
}

type Place = 'top' | 'bottom' | 'left' | 'right';

interface Step {
  attr: string;
  title: string;
  desc: string;
  place: Place;
}

const STEPS: Step[] = [
  {
    attr: 'niche',
    title: 'Выберите нишу',
    desc: '8 сценариев: прокат авто, салон красоты, доставка, цветы, недвижимость и другие. У каждой свой агент и структура CRM.',
    place: 'bottom',
  },
  {
    attr: 'tabs',
    title: 'Голос или чат',
    desc: 'Нажмите «Звонок» — агент ответит голосом прямо в браузере. Или «Чат» — общайтесь текстом. Оба варианта ведут диалог до оформления заявки.',
    place: 'bottom',
  },
  {
    attr: 'fields',
    title: 'CRM заполняется сама',
    desc: 'По ходу разговора агент вытаскивает имя, телефон, услугу, дату — и пишет в карточку в реальном времени. После — авто-саммари и скоринг лида.',
    place: 'right',
  },
  {
    attr: 'board',
    title: 'Календарь / доска / корзина',
    desc: 'В зависимости от ниши: запись в календарь для салона и клиники, доска бронирования для проката авто, корзина заказа для доставки.',
    place: 'top',
  },
  {
    attr: 'nariad',
    title: 'Наряд исполнителю',
    desc: 'Оформленная заявка сразу уходит исполнителю. Повар и курьер видят заказ, флорист — состав букета, мастер — клиента и услугу, риэлтор — детали осмотра.',
    place: 'top',
  },
];

const PAD = 8;
const TIP_W = 272;
const GAP = 16;
const ARR = 10;

interface Spotlight { top: number; left: number; width: number; height: number }
interface TipPos { top?: number; bottom?: number; left?: number; right?: number }

function calcTip(rect: DOMRect, place: Place): { tip: TipPos; arrLeft?: number; arrTop?: number } {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  if (place === 'bottom') {
    const left = Math.max(8, Math.min(vw - TIP_W - 8, cx - TIP_W / 2));
    return { tip: { top: rect.bottom + GAP, left }, arrLeft: Math.max(ARR + 2, Math.min(TIP_W - ARR * 3, cx - left - ARR)) };
  }
  if (place === 'top') {
    const left = Math.max(8, Math.min(vw - TIP_W - 8, cx - TIP_W / 2));
    return { tip: { bottom: vh - rect.top + GAP, left }, arrLeft: Math.max(ARR + 2, Math.min(TIP_W - ARR * 3, cx - left - ARR)) };
  }
  if (place === 'right') {
    const tipLeft = Math.min(rect.right + GAP, vw - TIP_W - 8);
    const top = Math.max(8, Math.min(vh - 220, cy - 100));
    return { tip: { left: tipLeft, top }, arrTop: Math.max(ARR + 2, cy - top - ARR) };
  }
  const top = Math.max(8, Math.min(vh - 220, cy - 100));
  return { tip: { right: vw - rect.left + GAP, top }, arrTop: Math.max(ARR + 2, cy - top - ARR) };
}

export function TourOverlay({ open, onClose }: TourProps) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const total = STEPS.length;
  const cur = STEPS[step];
  const isLast = step === total - 1;

  useEffect(() => { if (open) setStep(0); }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = document.querySelector<HTMLElement>(`[data-tour="${cur.attr}"]`);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const measure = () => setRect(el.getBoundingClientRect());
    measure();
    const t = setTimeout(measure, 350);
    return () => clearTimeout(t);
  }, [open, step]);

  if (!open) return null;

  const goNext = () => isLast ? onClose() : setStep(s => s + 1);
  const goPrev = () => setStep(s => Math.max(0, s - 1));

  // Spotlight bounds (with padding)
  const sl: Spotlight | null = rect
    ? { top: rect.top - PAD, left: rect.left - PAD, width: rect.width + PAD * 2, height: rect.height + PAD * 2 }
    : null;

  // 4 click-to-close strips around the spotlight (transparent, just capture clicks)
  // Spotlight itself is pointer-events:none so clicks reach the highlighted element
  const strips: React.CSSProperties[] = sl
    ? [
        { top: 0, left: 0, right: 0, height: Math.max(0, sl.top) },
        { top: sl.top + sl.height, left: 0, right: 0, bottom: 0 },
        { top: sl.top, left: 0, width: Math.max(0, sl.left), height: sl.height },
        { top: sl.top, left: sl.left + sl.width, right: 0, height: sl.height },
      ]
    : [{ inset: 0 }];

  const pos = rect ? calcTip(rect, cur.place) : null;

  return (
    <>
      {/* 4 transparent strips around spotlight — клик закрывает тур */}
      {strips.map((s, i) => (
        <div key={i} className="tour-strip" style={s} onClick={onClose} />
      ))}

      {/* Spotlight — вырезает элемент, pointer-events:none → клики проходят до элемента */}
      {sl && (
        <div className="tour-spotlight" style={{ top: sl.top, left: sl.left, width: sl.width, height: sl.height }} />
      )}

      {/* Tooltip со стрелкой */}
      {rect && pos && (
        <div className="tour-tip" style={{ ...pos.tip }}>
          {cur.place === 'bottom' && <div className="tour-arr tour-arr--up" style={{ left: pos.arrLeft }} />}
          {cur.place === 'top'    && <div className="tour-arr tour-arr--dn" style={{ left: pos.arrLeft }} />}
          {cur.place === 'right'  && <div className="tour-arr tour-arr--lt" style={{ top: pos.arrTop }} />}
          {cur.place === 'left'   && <div className="tour-arr tour-arr--rt" style={{ top: pos.arrTop }} />}

          <div className="tour-head">
            <span className="tour-badge">{step + 1} / {total}</span>
            <button className="tour-x" onClick={onClose}>✕</button>
          </div>
          <div className="tour-title">{cur.title}</div>
          <p className="tour-desc">{cur.desc}</p>
          <div className="tour-nav">
            {step > 0 && <button className="tour-btn tour-btn--ghost" onClick={goPrev}>← Назад</button>}
            <button className="tour-btn" onClick={goNext}>{isLast ? 'Готово ✓' : 'Далее →'}</button>
          </div>
        </div>
      )}
    </>
  );
}
