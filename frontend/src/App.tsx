import { useStore } from './store';
import { useSandbox } from './useSandbox';
import { NicheSwitcher } from './components/NicheSwitcher';
import { CrmBoard } from './components/CrmBoard';
import { VoiceWidget } from './components/VoiceWidget';
import { ChatWidget } from './components/ChatWidget';
import { RoiPanel } from './components/RoiPanel';
import { ContactGate } from './components/ContactGate';
import { IncomingCallOverlay } from './components/IncomingCallOverlay';
import { BehindTheScenes } from './components/BehindTheScenes';

export default function App() {
  const { launch, stop, sendText } = useSandbox();
  const transport = useStore((s) => s.transport);
  const mode = useStore((s) => s.mode);
  const toggleBehind = useStore((s) => s.toggleBehindScenes);
  const submitContact = useStore((s) => s.submitContact);

  // После заполнения гейта — сразу запускаем разговор на выбранном канале.
  const confirmContact = (name: string, phone: string) => {
    submitContact(name, phone);
    void launch(useStore.getState().channel);
  };

  return (
    <div className="min-h-full">
      <header className="border-b border-slate-800 bg-panel/40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <h1 className="text-base font-semibold text-white">
            Тестовый отдел продаж
            <span className="text-slate-500 font-normal"> · ИИ-консультант</span>
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <NicheSwitcher />
            <button
              onClick={toggleBehind}
              className="text-xs px-2 py-1 rounded border border-slate-600 text-slate-400 hover:text-slate-200"
            >
              под капотом
            </button>
          </div>
        </div>
      </header>

      {transport === 'simulator' && (
        <div className="bg-amber-950/40 border-b border-amber-800/40 text-amber-200 text-xs text-center py-1.5">
          Режим симуляции — проигрывается демо-сценарий (Dasha не подключена).
          {mode === 'presenter' && ' · презентер'}
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6">
        <CrmBoard />
        <div className="flex flex-col gap-4">
          <VoiceWidget onLaunch={() => void launch('voice')} onStop={stop} />
          <ChatWidget onLaunch={() => void launch('chat')} onSend={sendText} onStop={stop} />
          <RoiPanel />
        </div>
      </main>

      <ContactGate onConfirm={confirmContact} />
      <IncomingCallOverlay onAccept={() => void launch('voice')} />
      <BehindTheScenes />
    </div>
  );
}
