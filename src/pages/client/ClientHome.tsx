/**
 * pages/client/ClientHome.tsx
 * Главный экран клиента (кремовый): лого, заголовок, процесс записи, кнопка.
 * Заявки клиента вынесены в Профиль.
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
  'Заполните анкету и отправьте заявку',
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
      notify.error(`Достигнут лимит: максимум ${MAX_ACTIVE_ORDERS} активные заявки`);
      return;
    }
    selectionHaptic();
    navigate(CLIENT_ROUTES.FORM_SKETCH);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Шапка-лого + заголовок */}
      <div className="text-center pt-6">
        <p
          className="uppercase text-xs font-medium"
          style={{ letterSpacing: '0.22em', color: '#9a9a92' }}
        >
          LALI tattoo artist
        </p>
        <h1
          className="mt-3 font-light leading-[1.1]"
          style={{ fontSize: '33px', color: '#4a4a47' }}
        >
          Индивидуальный подбор тату
        </h1>
        <div
          className="mx-auto my-5"
          style={{ width: '40px', height: '2px', background: '#ABBDA3' }}
        />
        <p style={{ fontSize: '15px', color: '#8a8a82', lineHeight: 1.5 }}>
          Запись к мастеру
          <br />в несколько шагов
        </p>
      </div>

      {/* Процесс записи */}
      <div
        className="mt-8 rounded-3xl p-5"
        style={{ background: '#FFFFFF', border: '1px solid #efeede' }}
      >
        <p
          className="uppercase text-xs font-semibold mb-3"
          style={{ letterSpacing: '0.1em', color: '#9a9a92' }}
        >
          Процесс записи
        </p>
        <div className="space-y-1">
          {STEPS.map((text, i) => (
            <div key={i} className="flex items-start gap-3 py-2">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ border: '1px solid #dad9cd', color: '#9a9a92' }}
              >
                {i + 1}
              </div>
              <p style={{ fontSize: '14px', color: '#5a5a55', paddingTop: '3px' }}>
                {text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Кнопка записи */}
      <div className="mt-auto pt-8">
        <button
          onClick={handleStart}
          disabled={!canCreate}
          className="w-full rounded-2xl py-4 font-semibold transition-opacity"
          style={{
            fontSize: '16px',
            background: canCreate ? '#ABBDA3' : '#cdd5c8',
            color: '#FFFFFF',
          }}
        >
          Начать запись
        </button>
        {!canCreate && (
          <p
            className="text-center text-xs mt-3"
            style={{ color: '#9a9a92' }}
          >
            Достигнут лимит: максимум {MAX_ACTIVE_ORDERS} активные заявки.
            Дождитесь ответа мастера.
          </p>
        )}
      </div>
    </div>
  );
};
