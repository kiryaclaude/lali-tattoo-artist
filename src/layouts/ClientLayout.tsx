/**
 * layouts/ClientLayout.tsx
 * Layout для клиентской части приложения
 */

import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { getStepFromPath } from '../routes';
import { useFormStore } from '../store';

interface ClientLayoutProps {
  children: ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({
  children,
  showFooter = false,
}) => {
  const { pathname } = useLocation();
  const setCurrentStep = useFormStore((s) => s.setCurrentStep);

  // Держим currentStep в синхроне с маршрутом, чтобы прогресс и
  // валидация шага всегда соответствовали открытому экрану.
  useEffect(() => {
    const step = getStepFromPath(pathname);
    if (step >= 0) {
      setCurrentStep(step);
    }
  }, [pathname, setCurrentStep]);

  // Главная — это сплэш на весь экран (перекрывает фон),
  // у остальных клиентских экранов фон серый (фирменный оттенок).
  const isHome = pathname === '/';

  return (
    <div
      className={`flex flex-col min-h-screen text-white ${
        isHome ? 'bg-page' : 'client-surface'
      }`}
    >
      {/* Main content */}
      <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-5">
        {children}
      </main>

      {/* Footer будет добавлен в следующем этапе */}
      {showFooter && <footer>{/* Footer content */}</footer>}
    </div>
  );
};
