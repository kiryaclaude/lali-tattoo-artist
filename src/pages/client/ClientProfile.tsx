/**
 * pages/client/ClientProfile.tsx
 * Профиль клиента: его заявки + кнопка новой заявки.
 */

import React, { useEffect, useState } from 'react';
import { useNav } from '../../hooks';
import { hideMainButton, hideBackButton, orderService } from '../../services';
import { CLIENT_ROUTES } from '../../routes';
import { useNotification, useAppStore } from '../../store';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { formatPlacement, formatSize, formatTimeAgo } from '../../utils';
import { Button, LoadingSpinner } from '../../components/ui';
import type { Order } from '../../types';

const MAX_ACTIVE_ORDERS = 3;
const isActive = (o: Order) =>
  o.status !== 'rejected' && o.status !== 'cancelled';

export const ClientProfile: React.FC = () => {
  const { navigate } = useNav();
  const notify = useNotification();
  const telegramUser = useAppStore((s) => s.telegramUser);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hideBackButton();
    hideMainButton();
    orderService.getClientOrders().then((r) => {
      if (r.success && r.data) setOrders(r.data);
      setLoading(false);
    });
  }, []);

  const activeCount = orders.filter(isActive).length;
  const canCreate = activeCount < MAX_ACTIVE_ORDERS;

  const name = telegramUser
    ? [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ')
    : 'Гость';
  const initials = (telegramUser?.first_name?.[0] || 'Г').toUpperCase();

  const handleNew = () => {
    if (!canCreate) {
      notify.error(`Достигнут лимит: максимум ${MAX_ACTIVE_ORDERS} активные записи`);
      return;
    }
    navigate(CLIENT_ROUTES.FORM_SKETCH);
  };

  return (
    <div className="flex-1 flex flex-col space-y-6">
      {/* Шапка профиля */}
      <div className="flex items-center gap-3 pt-2">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-semibold"
          style={{ background: '#ABBDA3', color: '#2F3A2B' }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-white truncate">{name}</h1>
          <p className="text-sm text-muted">
            {telegramUser?.username ? `@${telegramUser.username}` : 'Личный кабинет'}
          </p>
        </div>
      </div>

      {/* Мои заявки */}
      <div className="flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted mb-3">
          Мои записи
        </p>

        {loading ? (
          <div className="py-10 flex justify-center">
            <LoadingSpinner size="md" text="Загрузка..." />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-line bg-card/40 p-8 text-center">
            <p className="text-muted text-sm">У вас пока нет записей</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <button
                key={o.id}
                onClick={() =>
                  navigate(CLIENT_ROUTES.ORDER_DETAIL.replace(':orderId', o.id))
                }
                className="w-full text-left flex items-center justify-between gap-3 rounded-2xl bg-card border border-line px-4 py-3"
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Новая заявка */}
      <div className="pt-2">
        <Button variant="primary" size="lg" fullWidth onClick={handleNew} disabled={!canCreate}>
          Новая запись
        </Button>
        {!canCreate && (
          <p className="text-center text-xs mt-3 text-muted">
            Достигнут лимит: максимум {MAX_ACTIVE_ORDERS} активные записи.
          </p>
        )}
      </div>
    </div>
  );
};
