import { useState } from 'react';
import { useStore } from '../store';

interface Props {
  onConfirm: (name: string, phone: string) => void;
}

// Гейт публичного режима. Контакт становится первым лидом и первой карточкой CRM —
// «оно уже записало меня». Одновременно лидген и точка вовлечения.
export function ContactGate({ onConfirm }: Props) {
  const open = useStore((s) => s.gateOpen);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  if (!open) return null;

  const valid = name.trim().length > 1 && phone.trim().length > 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-panel p-6">
        <h3 className="text-lg font-semibold text-white mb-1">Знакомимся — и начинаем</h3>
        <p className="text-sm text-slate-400 mb-4">
          Оставьте имя и телефон — и сразу увидите, как они появятся в CRM.
        </p>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 text-white outline-none focus:border-accent"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон"
            className="w-full rounded-lg bg-slate-800 border border-slate-600 px-3 py-2.5 text-white outline-none focus:border-accent"
          />
        </div>

        <button
          disabled={!valid}
          onClick={() => onConfirm(name.trim(), phone.trim())}
          className={`mt-4 w-full py-2.5 rounded-lg font-medium ${
            valid
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          Начать
        </button>
        <p className="text-[11px] text-slate-600 mt-3">
          Нажимая «Начать», вы соглашаетесь на обработку контактов для демонстрации.
        </p>
      </div>
    </div>
  );
}
