/**
 * layouts/ClientLayout.tsx
 * Layout клиента: кремовая главная, серые остальные экраны,
 * нижняя навигация (Главная / Профиль) на верхнеуровневых экранах.
 */

import React, { useEffect } from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getStepFromPath } from '../routes';
import { useFormStore } from '../store';

interface ClientLayoutProps {
  children: ReactNode;
}

const TABS = [
  {
    path: '/',
    label: 'Главная',
    icon: (
      <path d="M3 10.5L12 3l9 7.5M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5" />
    ),
  },
  {
    path: '/profile',
    label: 'Профиль',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" />
      </>
    ),
  },
];

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setCurrentStep = useFormStore((s) => s.setCurrentStep);

  useEffect(() => {
    const step = getStepFromPath(pathname);
    if (step >= 0) setCurrentStep(step);
  }, [pathname, setCurrentStep]);

  const isHome = pathname === '/';
  const isProfile = pathname === '/profile';
  const showTabBar = isHome || isProfile;

  return (
    <div
      className={`flex flex-col min-h-screen ${
        isHome ? 'surface-cream' : 'surface-gray'
      }`}
    >
      <main
        className={`flex-1 flex flex-col w-full max-w-md mx-auto px-6 py-5 ${
          showTabBar ? 'pb-24' : ''
        }`}
      >
        {children}
      </main>

      {showTabBar && (
        <nav className="fixed inset-x-0 bottom-0 z-30 bg-cream border-t border-black/5">
          <div className="max-w-md mx-auto flex">
            {TABS.map((tab) => {
              const active = pathname === tab.path;
              return (
                <button
                  key={tab.path}
                  onClick={() => navigate(tab.path)}
                  className="flex-1 flex flex-col items-center gap-1 py-3"
                >
                  <svg
                    className="w-6 h-6"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={active ? '#ABBDA3' : '#9a9a92'}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {tab.icon}
                  </svg>
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? '#7E9270' : '#9a9a92' }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};
