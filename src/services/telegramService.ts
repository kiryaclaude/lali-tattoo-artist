/**
 * TELEGRAM SERVICE - Интеграция с Telegram WebApp SDK
 * Фронтенд часть (backend часть будет добавлена позже)
 */

import { getTelegramWebApp, isTelegramWebApp } from '../utils';
import { TelegramUser, TelegramWebAppInitData } from '../types';

// ============================================================================
// TYPES
// ============================================================================

interface TelegramWebAppAPI {
  ready: () => void;
  expand: () => void;
  close: () => void;
  sendData: (data: string) => void;
  initData: string;
  initDataUnsafe: TelegramWebAppInitData;
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  isClosingConfirmationEnabled: boolean;
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText: (text: string) => void;
    onClick: (callback: () => void) => void;
    offClick: (callback: () => void) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    showProgress: () => void;
    hideProgress: () => void;
  };
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (
      type: 'error' | 'success' | 'warning'
    ) => void;
    selectionChanged: () => void;
  };
}

// ============================================================================
// STATE
// ============================================================================

let tg: TelegramWebAppAPI | null = null;
let isInitialized = false;

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Инициализирует Telegram WebApp
 * Должна вызваться один раз при загрузке приложения
 */
export const initTelegram = (): void => {
  if (!isTelegramWebApp()) {
    console.warn('[Telegram] WebApp API is not available');
    return;
  }

  tg = getTelegramWebApp();

  if (!tg) {
    console.error('[Telegram] Failed to initialize Telegram WebApp');
    return;
  }

  try {
    // Сигнал о готовности приложения
    tg.ready();

    // Развернуть на полный экран
    tg.expand();

    // Отключаем подтверждение закрытия по умолчанию
    // (будем вызывать его сами, когда нужно)
    // tg.enableClosingConfirmation(); // TODO: Включить при необходимости

    isInitialized = true;
    console.log('[Telegram] Initialized successfully');
  } catch (error) {
    console.error('[Telegram] Initialization failed:', error);
  }
};

// ============================================================================
// THEME & VIEWPORT
// ============================================================================

/**
 * Получает текущую тему (light/dark)
 */
export const getTelegramTheme = (): 'light' | 'dark' => {
  if (!tg) return 'light';
  return tg.colorScheme || 'light';
};

/**
 * Получает параметры темы Telegram
 */
export const getTelegramThemeParams = (): Record<string, string> => {
  if (!tg) return {};
  return tg.themeParams || {};
};

/**
 * Получает высоту viewport
 */
export const getViewportHeight = (): number => {
  if (!tg) return window.innerHeight;
  return tg.viewportHeight || window.innerHeight;
};

/**
 * Получает стабильную высоту viewport (когда клавиатура скрыта)
 */
export const getViewportStableHeight = (): number => {
  if (!tg) return window.innerHeight;
  return tg.viewportStableHeight || window.innerHeight;
};

/**
 * Применяет Telegram тему к приложению
 */
export const applyTelegramTheme = (): void => {
  const theme = getTelegramTheme();
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Применяем цвета из themeParams
  const params = getTelegramThemeParams();
  if (params.bg_color) {
    root.style.setProperty('--bg-color', params.bg_color);
  }
  if (params.text_color) {
    root.style.setProperty('--text-color', params.text_color);
  }
};

// ============================================================================
// USER DATA
// ============================================================================

/**
 * Получает данные пользователя из Telegram
 */
export const getTelegramUser = (): TelegramUser | null => {
  if (!tg) return null;

  const initData = tg.initDataUnsafe;
  return initData.user || null;
};

/**
 * Получает Raw init data (для проверки на backend)
 * TODO Backend: Проверить подпись HMAC-SHA256
 */
export const getTelegramInitData = (): string => {
  if (!tg) return '';
  return tg.initData || '';
};

// ============================================================================
// BACK BUTTON
// ============================================================================

let backButtonCallbacks: Set<() => void> = new Set();

/**
 * Показывает кнопку "Назад"
 */
export const showBackButton = (): void => {
  if (!tg?.BackButton) return;

  tg.BackButton.show();
};

/**
 * Скрывает кнопку "Назад"
 */
export const hideBackButton = (): void => {
  if (!tg?.BackButton) return;

  tg.BackButton.hide();
};

/**
 * Устанавливает callback на нажатие кнопки "Назад"
 * Может быть несколько слушателей (стек)
 */
export const onBackButton = (callback: () => void): (() => void) => {
  if (!tg?.BackButton) return () => {};

  backButtonCallbacks.add(callback);

  // Если это первый callback, подписываемся на события
  if (backButtonCallbacks.size === 1) {
    tg.BackButton.onClick(handleBackButtonClick);
  }

  // Возвращаем функцию для отписки
  return () => {
    backButtonCallbacks.delete(callback);
    if (backButtonCallbacks.size === 0) {
      tg!.BackButton.offClick(handleBackButtonClick);
    }
  };
};

/**
 * Internal handler для back button
 */
const handleBackButtonClick = (): void => {
  // Вызываем все callbacks в обратном порядке (стек)
  const callbacks = Array.from(backButtonCallbacks);
  if (callbacks.length > 0) {
    callbacks[callbacks.length - 1]();
  }
};

// ============================================================================
// MAIN BUTTON
// ============================================================================

/**
 * Показывает главную кнопку с текстом
 */
export const showMainButton = (text: string): void => {
  if (!tg?.MainButton) return;

  tg.MainButton.setText(text);
  tg.MainButton.show();
};

/**
 * Скрывает главную кнопку
 */
export const hideMainButton = (): void => {
  if (!tg?.MainButton) return;

  tg.MainButton.hide();
};

/**
 * Устанавливает callback на нажатие главной кнопки
 */
export const onMainButton = (callback: () => void): (() => void) => {
  if (!tg?.MainButton) return () => {};

  tg.MainButton.onClick(callback);

  // Возвращаем функцию для отписки
  return () => {
    tg!.MainButton.offClick(callback);
  };
};

/**
 * Включает главную кнопку
 */
export const enableMainButton = (): void => {
  if (!tg?.MainButton) return;
  tg.MainButton.enable();
};

/**
 * Отключает главную кнопку
 */
export const disableMainButton = (): void => {
  if (!tg?.MainButton) return;
  tg.MainButton.disable();
};

/**
 * Показывает progress на главной кнопке
 */
export const showMainButtonProgress = (): void => {
  if (!tg?.MainButton) return;
  tg.MainButton.showProgress();
};

/**
 * Скрывает progress на главной кнопке
 */
export const hideMainButtonProgress = (): void => {
  if (!tg?.MainButton) return;
  tg.MainButton.hideProgress();
};

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

/**
 * Вибрация при нажатии
 */
export const impactHaptic = (
  style: 'light' | 'medium' | 'heavy' = 'light'
): void => {
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.impactOccurred(style);
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
};

/**
 * Вибрация уведомления
 */
export const notificationHaptic = (
  type: 'error' | 'success' | 'warning' = 'success'
): void => {
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.notificationOccurred(type);
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
};

/**
 * Вибрация при выборе
 */
export const selectionHaptic = (): void => {
  if (!tg?.HapticFeedback) return;

  try {
    tg.HapticFeedback.selectionChanged();
  } catch (error) {
    console.debug('[Telegram] Haptic feedback not available:', error);
  }
};

// ============================================================================
// APP CONTROL
// ============================================================================

/**
 * Отправляет данные в Telegram (на бота)
 * TODO Backend: Обработать эти данные на стороне бота
 */
export const sendDataToBot = (data: string): void => {
  if (!tg) return;

  try {
    tg.sendData(data);
  } catch (error) {
    console.error('[Telegram] Failed to send data:', error);
  }
};

/**
 * Закрывает приложение
 */
export const closeApp = (): void => {
  if (!tg) return;

  try {
    tg.close();
  } catch (error) {
    console.error('[Telegram] Failed to close app:', error);
  }
};

/**
 * Проверяет, инициализирован ли Telegram WebApp
 */
export const isTelegramInitialized = (): boolean => {
  return isInitialized && tg !== null;
};

// ============================================================================
// REACT HOOK
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * Hook для управления Back Button
 * Автоматически скрывает/показывает при монтировании/размонтировании
 */
export const useBackButton = (
  callback: () => void,
  dependencies: any[] = []
): void => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    showBackButton();
    unsubscribeRef.current = onBackButton(callback);

    return () => {
      unsubscribeRef.current?.();
      hideBackButton();
    };
  }, [callback, ...dependencies]);
};

/**
 * Hook для управления Main Button
 */
export const useMainButton = (
  text: string,
  callback: () => void,
  dependencies: any[] = []
): void => {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    showMainButton(text);
    unsubscribeRef.current = onMainButton(callback);

    return () => {
      unsubscribeRef.current?.();
      hideMainButton();
    };
  }, [text, callback, ...dependencies]);
};

/**
 * Hook для применения Telegram темы
 */
export const useTelegramTheme = (): void => {
  useEffect(() => {
    applyTelegramTheme();

    // Переприменяем тему при изменении window size
    // (может измениться при показе/скрытии клавиатуры)
    const handleResize = () => {
      applyTelegramTheme();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
};
