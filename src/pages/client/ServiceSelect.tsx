/**
 * pages/client/ServiceSelect.tsx
 * Выбор услуги: запись / перекрытие / коррекция / консультация (бесплатно).
 */
import React, { useEffect } from 'react';
import { useNav } from '../../hooks';
import { useFormStore } from '../../store';
import { hideMainButton } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { SERVICE_OPTIONS } from '../../constants';
import type { ServiceType } from '../../types';

const ICONS: Record<string, React.ReactNode> = {
  needle: <path d="M3 21l6-6m0 0l9-9 3 3-9 9m-3-3l3 3M14 4l6 6" />,
  layers: (
    <>
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </>
  ),
  edit: <path d="M4 20h4L18.5 9.5a2.1 2.1 0 00-3-3L5 17v3z" />,
  chat: <path d="M21 12a8 8 0 01-11.5 7.2L4 20l1-4.5A8 8 0 1121 12z" />,
};

export const ServiceSelect: React.FC = () => {
  const { navigate } = useNav();
  const resetForm = useFormStore((s) => s.resetForm);
  const setServiceType = useFormStore((s) => s.setServiceType);

  useEffect(() => {
    hideMainButton();
  }, []);

  const choose = (type: ServiceType) => {
    resetForm();
    setServiceType(type);
    navigate(type === 'consultation' ? CLIENT_ROUTES.CONSULT : CLIENT_ROUTES.FORM_SKETCH);
  };

  return (
    <div className="flex-1 flex flex-col">
      <button
        onClick={() => navigate(CLIENT_ROUTES.HOME)}
        className="inline-flex items-center gap-1 text-brand font-medium text-sm self-start mb-5"
      >
        ‹ На главную
      </button>

      <h1 className="text-2xl font-bold text-white mb-1">Выберите услугу</h1>
      <p className="text-sm text-muted mb-6">С чем хотите записаться к мастеру</p>

      <div className="space-y-3">
        {SERVICE_OPTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => choose(s.id)}
            className="w-full text-left flex items-center gap-3 rounded-2xl bg-card border border-line px-4 py-3.5 hover:bg-card-2 transition-colors"
          >
            <div
              className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(171,189,163,0.25)' }}
            >
              <svg
                className="w-6 h-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ABBDA3"
                strokeWidth={1.7}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {ICONS[s.icon]}
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-semibold text-white">
                  {s.label}
                </span>
                {s.free && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: '#ABBDA3', color: '#2F3A2B' }}
                  >
                    Бесплатно
                  </span>
                )}
              </div>
              <p className="text-xs text-muted mt-0.5">{s.desc}</p>
            </div>
            <span className="text-muted">›</span>
          </button>
        ))}
      </div>
    </div>
  );
};
