import { useStore } from '../store';
import { matchObject } from '../config/realtyObjects';

// Демо-страница «Детали осмотра» — то, что открывалось бы по ссылке из чата/СМС
// у реального агентства: карточка объекта + детали визита.
export function ViewingModal() {
  const open = useStore((s) => s.viewingOpen);
  const viewing = useStore((s) => s.viewing);
  const close = useStore((s) => s.closeViewing);
  if (!open || !viewing) return null;
  const obj = matchObject(viewing.service);

  return (
    <div className="hood-overlay" onClick={close}>
      <div className="hood viewing" onClick={(e) => e.stopPropagation()}>
        <div className="hood-head">
          <h3>Детали осмотра</h3>
          <button className="hood-x" onClick={close}>✕</button>
        </div>

        <div className="vw-photo">{obj?.emoji ?? '🏠'}</div>
        <div className="vw-obj-title">{obj?.title ?? (viewing.service || 'Объект')}</div>
        {obj && (
          <>
            <div className="vw-specs">
              {obj.area} · {obj.floor} · <span className="vw-price">{obj.price}</span>
            </div>
            <div className="vw-deal">{obj.deal}</div>
          </>
        )}

        <div className="vw-rows">
          <div className="vw-row"><span>Дата и время</span><b>{viewing.date || '—'}</b></div>
          <div className="vw-row"><span>Риэлтор</span><b>{viewing.realtor || '—'}</b></div>
          <div className="vw-row"><span>Телефон</span><b>{viewing.phone || '—'}</b></div>
          <div className="vw-row"><span>Клиент</span><b>{viewing.client || '—'}</b></div>
          <div className="vw-row"><span>Адрес</span><b>{obj?.title.split(', ').slice(1).join(', ') || '—'} · на карте</b></div>
          <div className="vw-row"><span>С собой</span><b>паспорт</b></div>
        </div>

        <div className="vw-actions">
          <button className="vw-btn" onClick={close}>Перенести</button>
          <button className="vw-btn vw-btn--ghost" onClick={close}>Отменить</button>
        </div>
        <div className="vw-note">Демо-страница: так выглядела бы ссылка с деталями у реального агентства (карточка объекта + запись на осмотр).</div>
      </div>
    </div>
  );
}
