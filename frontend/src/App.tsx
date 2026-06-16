import { useState, useEffect } from 'react';
import { useStore } from './store';
import { useSandbox } from './useSandbox';
import { NicheSwitcher } from './components/NicheSwitcher';
import { CrmBoard } from './components/CrmBoard';
import { Calendar } from './components/Calendar';
import { OrderBoard } from './components/OrderBoard';
import { RentalBoard } from './components/RentalBoard';
import { NaryadPanel } from './components/NaryadPanel';
import { InteractionPanel } from './components/InteractionPanel';
import { RoiPanel } from './components/RoiPanel';
import { IncomingCallOverlay } from './components/IncomingCallOverlay';
import { BehindTheScenes } from './components/BehindTheScenes';
import { ViewingModal } from './components/ViewingModal';
import { TourOverlay } from './components/TourOverlay';
import { InvoiceFlow } from './components/InvoiceFlow';

const HOOD_ITEMS: [string, string][] = [
  ['Речь → текст → речь', 'Распознавание и синтез голоса в реальном времени, без задержек.'],
  ['Извлечение сущностей', 'Имя, услуга, дата, телефон вытаскиваются из реплик и пишутся в CRM.'],
  ['Интеграции', 'Запись в календарь, доску аренды, отправка SMS-подтверждения.'],
  ['Авто-саммари и скоринг', 'После разговора — суть, статус и оценка лида одним абзацем.'],
  ['Под ваш бизнес', 'Тон, услуги, цены и логика диалога настраиваются индивидуально.'],
];

function UnderHoodModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="hood-overlay" onClick={onClose}>
      <div className="hood" onClick={(e) => e.stopPropagation()}>
        <div className="hood-head">
          <h3>Что под капотом</h3>
          <button className="hood-x" onClick={onClose}>✕</button>
        </div>
        <p className="hood-lede">
          Это не статичный макет — за демо стоит тот же конвейер, что работает у клиентов.
        </p>
        <div className="hood-list">
          {HOOD_ITEMS.map(([h, d], i) => (
            <div key={i} className="hood-item">
              <span className="hood-num">{i + 1}</span>
              <div>
                <div className="hood-h">{h}</div>
                <div className="hood-d">{d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { launch, stop } = useSandbox();
  const crmView = useStore((s) => s.niche.crmView);
  const nicheDisclaimer = useStore((s) => s.niche.disclaimer);
  const [hoodOpen, setHoodOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  useEffect(() => {
    const isPresenter = new URLSearchParams(window.location.search).has('presenter');
    if (!isPresenter) setTourOpen(true);
  }, []);

  const closeTour = () => setTourOpen(false);

  return (
    <div className="app" data-theme="trust">
      <header className="header">
        <div className="brand">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="3.2" fill="#fff" />
              <circle cx="10" cy="10" r="6.4" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.4" />
            </svg>
          </div>
          <div>
            <div className="brand-name">Тестовый отдел продаж</div>
            <div className="brand-sub">ИИ-консультант · демо-песочница</div>
          </div>
        </div>
        <button className="hood-btn" onClick={() => setHoodOpen(true)}>под капотом</button>
      </header>

      <div className="niche-wrap" data-tour="niche">
        <NicheSwitcher />
      </div>

      <div className="demo-banner">
        <span className="demo-ico">i</span>
        <span>
          <b>Демо-режим.</b> Данные и сценарии условные. Под каждый бизнес бот настраивается
          индивидуально — тон, услуги, цены и логика диалога.
        </span>
      </div>

      {nicheDisclaimer && (
        <div className="demo-banner">
          <span className="demo-ico">i</span>
          <span>{nicheDisclaimer}</span>
        </div>
      )}

      <main className="layout">
        <div>
          <CrmBoard />
          {crmView === 'order' && (
            <>
              <div style={{ marginTop: 'var(--gap)' }} data-tour="board">
                <OrderBoard />
              </div>
              <div style={{ marginTop: 'var(--gap)' }}>
                <InvoiceFlow />
              </div>
              <div style={{ marginTop: 'var(--gap)' }}>
                <NaryadPanel />
              </div>
            </>
          )}
        </div>
        <div className="col--right">
          <InteractionPanel onLaunch={() => void launch('voice')} onStop={stop} />
          <RoiPanel />
        </div>
      </main>

      {(crmView === 'rental' || crmView === 'calendar') && (
        <div className="board-wrap">
          <div data-tour="board">
            {crmView === 'rental' ? <RentalBoard /> : <Calendar />}
          </div>
          <div style={{ marginTop: 'var(--gap)' }}>
            <NaryadPanel />
          </div>
        </div>
      )}

      <footer className="page-foot">
        <div className="foot-cta">
          <span>Хотите такую систему под свой бизнес? Внедрим под ключ.</span>
          <div className="foot-contacts">
            <a className="foot-tg" href="https://t.me/nickddd" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.7 13.1l-4.64-1.45c-1.01-.32-1.03-1.01.21-1.5l18.13-6.99c.84-.31 1.58.19 1.3 1.44z" />
              </svg>
              Telegram
            </a>
            <a className="foot-tg foot-max" href="tel:+79265383933" title="+7 926 538-39-33">
              <svg viewBox="0 0 1000 1000" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M508.211 878.328c-75.007 0-109.864-10.95-170.453-54.75-38.325 49.275-159.686 87.783-164.979 21.9 0-49.456-10.95-91.248-23.36-136.873-14.782-56.21-31.572-118.807-31.572-209.508 0-216.626 177.754-379.597 388.357-379.597 210.785 0 375.947 171.001 375.947 381.604.707 207.346-166.595 376.118-373.94 377.224m3.103-571.585c-102.564-5.292-182.499 65.7-200.201 177.024-14.6 92.162 11.315 204.398 33.397 210.238 10.585 2.555 37.23-18.98 53.837-35.587a189.8 189.8 0 0 0 92.71 33.032c106.273 5.112 197.08-75.794 204.215-181.95 4.154-106.382-77.67-196.486-183.958-202.574Z" />
              </svg>
              Max
            </a>
          </div>
        </div>
        <div className="foot-copy">
          Тестовый отдел продаж — интерактивная демонстрация ИИ-автоматизации продаж.
        </div>
      </footer>

      <TourOverlay open={tourOpen} onClose={closeTour} />
      <button className="tour-fab" onClick={() => setTourOpen(true)} title="Как пользоваться">?</button>
      <IncomingCallOverlay onAccept={() => void launch('voice')} />
      <ViewingModal />
      <BehindTheScenes />
      <UnderHoodModal open={hoodOpen} onClose={() => setHoodOpen(false)} />
    </div>
  );
}
