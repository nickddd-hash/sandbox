import { useStore } from './store';
import { useSandbox } from './useSandbox';
import { NicheSwitcher } from './components/NicheSwitcher';
import { CrmBoard } from './components/CrmBoard';
import { Calendar } from './components/Calendar';
import { OrderBoard } from './components/OrderBoard';
import { RentalBoard } from './components/RentalBoard';
import { VoiceWidget } from './components/VoiceWidget';
import { ChatWidget } from './components/ChatWidget';
import { RoiPanel } from './components/RoiPanel';
import { IncomingCallOverlay } from './components/IncomingCallOverlay';
import { BehindTheScenes } from './components/BehindTheScenes';

export default function App() {
  const { launch, stop } = useSandbox();
  const transport = useStore((s) => s.transport);
  const mode = useStore((s) => s.mode);
  const crmView = useStore((s) => s.niche.crmView);
  const nicheDisclaimer = useStore((s) => s.niche.disclaimer);
  const toggleBehind = useStore((s) => s.toggleBehindScenes);

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-800 bg-panel/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold text-white">
            Тестовый отдел продаж
            <span className="text-slate-500 font-normal"> · ИИ-консультант</span>
          </h1>
          <div className="ml-auto">
            <button
              onClick={toggleBehind}
              className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200"
            >
              под капотом
            </button>
          </div>
        </div>
        <div className="border-t border-amber-500/30 bg-amber-500/10">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-3">
            <p className="text-sm font-medium text-amber-300">
              ⚠️ Демо-режим: данные и сценарии условные. Под каждый бизнес бот настраивается индивидуально — тон, стиль, услуги, цены, логика диалога.
            </p>
            <NicheSwitcher />
          </div>
        </div>
        {nicheDisclaimer && (
          <div className="border-t border-blue-500/30 bg-blue-500/10">
            <div className="max-w-6xl mx-auto px-4 py-2.5">
              <p className="text-sm text-blue-300">{nicheDisclaimer}</p>
            </div>
          </div>
        )}
      </header>

      {transport === 'simulator' && mode === 'presenter' && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 text-amber-200 text-xs text-center py-1.5">
          Демо-сценарий · презентер
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <div className="flex flex-col gap-6">
          <CrmBoard />
          {/* Блок заказа — сразу под карточкой лида, чтобы был на виду */}
          {crmView === 'order' && <OrderBoard />}
        </div>
        <div className="flex flex-col gap-4">
          <VoiceWidget onLaunch={() => void launch('voice')} onStop={stop} />
          <ChatWidget />
          <RoiPanel />
        </div>
      </main>

      {/* Широкие доски для остальных ниш */}
      {(crmView === 'rental' || crmView === 'calendar') && (
        <div className="max-w-6xl mx-auto px-4 pb-8">
          {crmView === 'rental' ? <RentalBoard /> : <Calendar />}
        </div>
      )}

      <IncomingCallOverlay onAccept={() => void launch('voice')} />
      <BehindTheScenes />
    </div>
  );
}
