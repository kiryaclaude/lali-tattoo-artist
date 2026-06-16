/**
 * App.tsx
 * Главный компонент приложения
 * Устанавливает routing, провайдеры и инициализирует приложение
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore, useUserRole } from './store';
import { CLIENT_ROUTES, MASTER_ROUTES } from './routes';
import { initTelegram, useTelegramTheme } from './services';
import { getTelegramUser } from './services';
import { ClientLayout, MasterLayout } from './layouts';
import { ToastContainer } from './components/ui';
import { MASTER_TELEGRAM_IDS } from './constants';

type UserRole = 'client' | 'master';

/**
 * Определяет роль пользователя.
 * Приоритет:
 *  1) dev-override через URL (?role=master|client) — для локального просмотра;
 *  2) сохранённый dev-override в localStorage;
 *  3) Telegram id мастера из MASTER_TELEGRAM_IDS — это и есть «админ»;
 *  4) иначе — клиент.
 */
function resolveUserRole(telegramId?: number): UserRole {
  // 1) URL override (?role=master / ?role=client)
  const urlRole = new URLSearchParams(window.location.search).get('role');
  if (urlRole === 'master' || urlRole === 'client') {
    localStorage.setItem('user_role', urlRole);
    return urlRole;
  }

  // 2) Сохранённый override
  const saved = localStorage.getItem('user_role');
  if (saved === 'master' || saved === 'client') {
    return saved;
  }

  // 3) Мастер по Telegram id владельца
  if (telegramId && MASTER_TELEGRAM_IDS.includes(telegramId)) {
    return 'master';
  }

  // 4) По умолчанию — клиент
  return 'client';
}

// Client Pages
import {
  ClientHome,
  ClientProfile,
  ServiceSelect,
  ConsultForm,
  SketchUpload,
  PlacementSelect,
  SizeInput,
  AgeInput,
  HealthSelect,
  ExperienceSelect,
  WishesInput,
  SuccessScreen,
  ClientOrderDetails,
} from './pages/client';

// Master Pages
import {
  MasterDashboard,
  MasterOrderDetails,
} from './pages/master';

/**
 * Главный компонент приложения
 */
const App: React.FC = () => {
  const setTelegramUser = useAppStore((state) => state.setTelegramUser);
  const setUserRole = useAppStore((state) => state.setUserRole);
  const setInitialized = useAppStore((state) => state.setInitialized);
  const userRole = useUserRole();

  useTelegramTheme();

  // Инициализация при загрузке
  useEffect(() => {
    // Инициализируем Telegram WebApp
    initTelegram();

    // Получаем данные пользователя из Telegram
    const tgUser = getTelegramUser();
    if (tgUser) {
      setTelegramUser(tgUser);
    }

    // Роль: мастер только у владельца (по Telegram id),
    // плюс dev-override через ?role= для локального просмотра.
    // TODO Backend: подтверждать роль на сервере (проверка initData).
    setUserRole(resolveUserRole(tgUser?.id));

    setInitialized(true);
  }, [setTelegramUser, setUserRole, setInitialized]);

  // Загрузка  инициализация
  if (!userRole) {
    return <div>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* CLIENT ROUTES */}
        {userRole === 'client' && (
          <>
            <Route
              path={CLIENT_ROUTES.HOME}
              element={
                <ClientLayout>
                  <ClientHome />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.PROFILE}
              element={
                <ClientLayout>
                  <ClientProfile />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.SERVICES}
              element={
                <ClientLayout>
                  <ServiceSelect />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.CONSULT}
              element={
                <ClientLayout>
                  <ConsultForm />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_SKETCH}
              element={
                <ClientLayout>
                  <SketchUpload />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_PLACEMENT}
              element={
                <ClientLayout>
                  <PlacementSelect />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_SIZE}
              element={
                <ClientLayout>
                  <SizeInput />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_AGE}
              element={
                <ClientLayout>
                  <AgeInput />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_HEALTH}
              element={
                <ClientLayout>
                  <HealthSelect />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_EXPERIENCE}
              element={
                <ClientLayout>
                  <ExperienceSelect />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_WISHES}
              element={
                <ClientLayout>
                  <WishesInput />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.FORM_SUCCESS}
              element={
                <ClientLayout>
                  <SuccessScreen />
                </ClientLayout>
              }
            />
            <Route
              path={CLIENT_ROUTES.ORDER_DETAIL}
              element={
                <ClientLayout>
                  <ClientOrderDetails />
                </ClientLayout>
              }
            />

            {/* Fallback для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to={CLIENT_ROUTES.HOME} replace />} />
          </>
        )}

        {/* MASTER ROUTES */}
        {userRole === 'master' && (
          <>
            <Route
              path={MASTER_ROUTES.HOME}
              element={
                <MasterLayout>
                  <MasterDashboard />
                </MasterLayout>
              }
            />
            <Route
              path={MASTER_ROUTES.DASHBOARD}
              element={
                <MasterLayout>
                  <MasterDashboard />
                </MasterLayout>
              }
            />
            <Route
              path={MASTER_ROUTES.ORDER_DETAIL}
              element={
                <MasterLayout>
                  <MasterOrderDetails />
                </MasterLayout>
              }
            />

            {/* Fallback для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to={MASTER_ROUTES.HOME} replace />} />
          </>
        )}
      </Routes>

      {/* Global Toast container */}
      <ToastContainer />
    </BrowserRouter>
  );
};

export default App;
