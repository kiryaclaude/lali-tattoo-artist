/**
 * pages/client/Home.tsx
 * Главный экран клиента: сплэш-логотип, список заявок и кнопка новой заявки.
 */

import React, { useEffect, useState } from 'react';
import { useNav } from '../../hooks';
import {
  useMainButton,
  hideBackButton,
  selectionHaptic,
  getClientId,
  orderService,
} from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { Button } from '../../components/ui';
import { useNotification } from '../../store';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { formatPlacement, formatSize, formatTimeAgo } from '../../utils';
import type { Order } from '../../types';

const MAX_ACTIVE_ORDERS = 3;
const isActive = (o: Order) =>
  o.status !== 'rejected' && o.status !== 'cancelled';

export const ClientHome: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const [orders, setOrders] = useState<Order[]>([]);

  // Скрываем Back Button на главной странице
  useEffect(() => {
    hideBackButton();
  }, []);

  // Загружаем заявки клиента
  useEffect(() => {
    let alive = true;
    orderService.getClientOrders(getClientId()).then((res) => {
      if (alive && res.success && res.data) {
        setOrders(res.data);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const activeCount = orders.filter(isActive).length;
  const canCreate = activeCount < MAX_ACTIVE_ORDERS;
  const hasOrders = orders.length > 0;

  const handleStartForm = () => {
    if (!canCreate) {
      notify.error(
        `Достигнут лимит: максимум ${MAX_ACTIVE_ORDERS} активные заявки`
      );
      return;
    }
    selectionHaptic();
    navigate(CLIENT_ROUTES.FORM_SKETCH);
  };

  // Telegram MainButton дублирует основное действие
  useMainButton(hasOrders ? 'Новая заявка' : 'Начать запись', handleStartForm);

  return (
    // Сплэш: логотип во весь экран + контент снизу.
    // fixed inset-0 — выходим за паддинги ClientLayout на весь вьюпорт.
    <div className="fixed inset-0 mx-auto max-w-md bg-page overflow-hidden">
      {/* Подложка: размытая текстура заполняет экран при любой пропорции */}
      <img
        src="/lali-logo.jpg"
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-70"
      />
      {/* Логотип целиком по центру (не обрезается) */}
      <img
        src="/lali-logo.jpg"
        alt="LALI — tattoo artist"
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Затемнение снизу для читаемости контента */}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-page via-page/85 to-transparent" />

      {/* Контент снизу */}
      <div className="absolute inset-x-0 bottom-0 px-6 pb-8 pt-4 space-y-4">
        {hasOrders && (
          <div className="space-y-2 max-h-[42vh] overflow-y-auto">
            <p className="text-xs font-medium uppercase tracking-wider text-muted">
              Мои заявки
            </p>
            {orders.map((o) => (
              <div
                key={o.id}
                className="flex items-center justify-between gap-3 rounded-2xl bg-card/80 backdrop-blur border border-line px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {formatPlacement(o.placement)} ·{' '}
                    {formatSize(o.size.height, o.size.width)}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {formatTimeAgo(new Date(o.createdAt))}
                  </p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    ORDER_STATUS_COLORS[o.status] || ''
                  }`}
                >
                  {ORDER_STATUS_LABELS[o.status] || o.status}
                </span>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleStartForm}
          disabled={!canCreate}
        >
          {hasOrders ? 'Новая заявка' : 'Начать запись'}
        </Button>

        {!canCreate && (
          <p className="text-xs text-center text-muted">
            Достигнут лимит: максимум {MAX_ACTIVE_ORDERS} активные заявки.
            Дождитесь ответа мастера.
          </p>
        )}
      </div>
    </div>
  );
};
