import { useState } from 'react';
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
  const [contactsOpen, setContactsOpen] = useState(false);

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

      <div className="niche-wrap">
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
              <div style={{ marginTop: 'var(--gap)' }}>
                <OrderBoard />
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
          {crmView === 'rental' ? <RentalBoard /> : <Calendar />}
          <div style={{ marginTop: 'var(--gap)' }}>
            <NaryadPanel />
          </div>
        </div>
      )}

      <footer className="page-foot">
        <div className="foot-cta">
          <span>Хотите такую систему под свой бизнес? Внедрим под ключ.</span>
          {contactsOpen ? (
            <div className="foot-contacts">
              <a className="foot-tg" href="https://t.me/nickddd" target="_blank" rel="noopener noreferrer">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M21.94 4.6 18.9 19.2c-.23 1.02-.84 1.27-1.7.79l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.78 8.7-7.86c.38-.34-.08-.53-.59-.19L6.7 13.1l-4.64-1.45c-1.01-.32-1.03-1.01.21-1.5l18.13-6.99c.84-.31 1.58.19 1.3 1.44z" />
                </svg>
                Telegram: @nickddd
              </a>
              <a className="foot-tg foot-max" href="tel:+79265383933">
                Max: +7 926 538-39-33
              </a>
            </div>
          ) : (
            <button type="button" className="foot-tg" onClick={() => setContactsOpen(true)}>
              Связаться
            </button>
          )}
        </div>
        <div className="foot-copy">
          Тестовый отдел продаж — интерактивная демонстрация ИИ-автоматизации продаж.
        </div>
      </footer>

      <IncomingCallOverlay onAccept={() => void launch('voice')} />
      <BehindTheScenes />
      <UnderHoodModal open={hoodOpen} onClose={() => setHoodOpen(false)} />
    </div>
  );
}
