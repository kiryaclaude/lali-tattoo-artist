/**
 * pages/client/ClientHome.tsx
 * Главная (серый фон): логотип LALI + окошко «Процесс записи» + кнопка.
 */

import React, { useEffect, useState } from 'react';
import { useNav } from '../../hooks';
import {
  hideMainButton,
  hideBackButton,
  selectionHaptic,
  orderService,
} from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useNotification } from '../../store';

const MAX_ACTIVE_ORDERS = 3;

const STEPS = [
  'Загрузите эскиз или опишите идею',
  'Выберите место и размер',
  'Заполните анкету и отправьте запись',
];

export const ClientHome: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
    orderService.getActiveCount().then((r) => {
      if (r.success && r.data) setActiveCount(r.data.count);
    });
  }, []);

  const canCreate = activeCount < MAX_ACTIVE_ORDERS;

  const handleStart = () => {
    if (!canCreate) {
      notify.error(`Достигнут лимит: максимум ${MAX_ACTIVE_ORDERS} активные записи`);
      return;
    }
    selectionHaptic();
    navigate(CLIENT_ROUTES.FORM_SKETCH);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Логотип */}
      <div className="text-center pt-8">
        <svg
          className="mx-auto mb-1"
          width="96"
          height="18"
          viewBox="0 0 96 18"
          aria-hidden="true"
        >
          <path
            d="M3 12 C26 3,50 3,68 9 C75 11,83 5,77 2"
            fill="none"
            stroke="#ABBDA3"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            fontSize: '46px',
            fontWeight: 600,
            letterSpacing: '5px',
            color: '#FFFFFF',
            lineHeight: 1,
          }}
        >
          LALI<span style={{ color: '#ABBDA3' }}>.</span>
        </div>
        <div
          className="mt-2"
          style={{ fontSize: '15px', letterSpacing: '4px', color: '#ABBDA3' }}
        >
          tattoo artist
        </div>
      </div>

      {/* Процесс записи */}
      <div className="mt-10 rounded-3xl bg-card border border-line p-5">
        <p className="uppercase text-xs font-semibold mb-3 tracking-wider text-muted">
          Процесс записи
        </p>
        <div className="space-y-1">
          {STEPS.map((text, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs text-white"
                style={{ border: '1px solid rgba(255,255,255,0.4)' }}
              >
                {i + 1}
              </div>
              <p className="text-sm text-white pt-1">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка записи */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleStart}
          disabled={!canCreate}
          className="w-full rounded-2xl py-4 font-semibold"
          style={{
            fontSize: '16px',
            background: canCreate ? '#ABBDA3' : '#8a9583',
            color: '#FFFFFF',
          }}
        >
          Начать запись
        </button>
        {!canCreate && (
          <p className="text-center text-xs mt-3 text-muted">
            Достигнут лимит: максимум {MAX_ACTIVE_ORDERS} активные записи.
            Дождитесь ответа мастера.
          </p>
        )}
      </div>
    </div>
  );
};
