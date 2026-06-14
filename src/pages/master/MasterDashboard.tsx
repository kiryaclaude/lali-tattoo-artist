/**
 * pages/master/Dashboard.tsx
 * Кабинет мастера — список заявок с фильтрами по статусу и рассылкой.
 */

import React, { useEffect, useState } from 'react';
import { useMasterStore, useNotification } from '../../store';
import { orderService } from '../../services';
import { useNav } from '../../hooks';
import { LoadingSpinner, Modal, Button, Input } from '../../components/ui';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { formatTimeAgo, formatSize, formatPlacement } from '../../utils';
import { MASTER_ROUTES } from '../../routes';

const FILTERS: { key: string | null; label: string }[] = [
  { key: null, label: 'Все' },
  { key: 'pending', label: 'Новые' },
  { key: 'awaiting_price', label: 'Уточнение' },
  { key: 'price_set', label: 'Согласовано' },
  { key: 'payment_pending', label: 'Оплата' },
  { key: 'confirmed', label: 'Подтверждено' },
  { key: 'rejected', label: 'Отклонено' },
];

function pluralOrders(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'заявка';
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return 'заявки';
  return 'заявок';
}

/** Превью эскиза с graceful-фолбэком (битые/мок-ссылки → иконка). */
const SketchThumb: React.FC<{ url?: string; className?: string }> = ({
  url,
  className,
}) => {
  const [err, setErr] = useState(false);
  const showImg = !!url && !err && /^(https?:|data:)/.test(url);
  return (
    <div
      className={`bg-card-2 rounded-xl flex items-center justify-center overflow-hidden ${
        className || ''
      }`}
    >
      {showImg ? (
        <img
          src={url}
          alt=""
          className="w-full h-full object-cover"
          onError={() => setErr(true)}
        />
      ) : (
        <svg
          className="w-6 h-6 text-hint"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      )}
    </div>
  );
};

export const MasterDashboard: React.FC = () => {
  const setOrders = useMasterStore((s) => s.setOrders);
  const setLoadingOrders = useMasterStore((s) => s.setLoadingOrders);
  const setSelectedOrder = useMasterStore((s) => s.setSelectedOrder);
  const setFilterStatus = useMasterStore((s) => s.setFilterStatus);
  const allOrders = useMasterStore((s) => s.orders);
  const filterStatus = useMasterStore((s) => s.filterStatus);
  const isLoading = useMasterStore((s) => s.isLoadingOrders);
  const { navigate } = useNav();
  const notify = useNotification();

  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [broadcastText, setBroadcastText] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoadingOrders(true);
      try {
        const res = await orderService.getMasterOrders(); // все статусы
        if (res.success && res.data) setOrders(res.data);
      } catch (e) {
        console.error('Failed to load orders:', e);
      } finally {
        setLoadingOrders(false);
      }
    };
    setFilterStatus(null); // по умолчанию — все
    load();
  }, [setOrders, setLoadingOrders, setFilterStatus]);

  const handleSelect = (id: string) => {
    setSelectedOrder(id);
    navigate(MASTER_ROUTES.ORDER_DETAIL.replace(':orderId', id));
  };

  const countFor = (key: string | null) =>
    key === null
      ? allOrders.length
      : allOrders.filter((o) => o.status === key).length;

  const visible = [
    ...(filterStatus
      ? allOrders.filter((o) => o.status === filterStatus)
      : allOrders),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const [broadcasting, setBroadcasting] = useState(false);
  const handleBroadcast = async () => {
    if (!broadcastText.trim()) {
      notify.error('Введите текст рассылки');
      return;
    }
    setBroadcasting(true);
    try {
      const res = await orderService.broadcast(broadcastText.trim());
      if (res.success && res.data) {
        notify.success(`Рассылка отправлена: ${res.data.sent} из ${res.data.total}`);
        setBroadcastOpen(false);
        setBroadcastText('');
      } else {
        notify.error(res.error?.message || 'Не удалось отправить рассылку');
      }
    } finally {
      setBroadcasting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Загрузка заявок..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Заявки</h1>
        <button
          onClick={() => setBroadcastOpen(true)}
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-card border border-line px-3 py-1.5 text-sm text-white hover:bg-card-2 transition-colors"
        >
          📢 Рассылка
        </button>
      </div>

      {/* Фильтры по статусу */}
      <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1">
        {FILTERS.map((f) => {
          const active = filterStatus === f.key;
          const c = countFor(f.key);
          return (
            <button
              key={f.label}
              onClick={() => setFilterStatus(f.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                active
                  ? 'bg-brand text-page border-brand font-medium'
                  : 'bg-card text-muted border-line'
              }`}
            >
              {f.label}
              {c > 0 && (
                <span className={active ? ' opacity-80' : ' text-hint'}> {c}</span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-sm text-muted">
        {visible.length} {pluralOrders(visible.length)}
      </p>

      {/* Список */}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card/40 text-center py-12">
          <p className="text-muted">Заявок нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <button
              key={order.id}
              onClick={() => handleSelect(order.id)}
              className="w-full text-left rounded-2xl border border-line bg-card p-4 hover:bg-card-2 transition-colors"
            >
              <div className="flex gap-3">
                <SketchThumb url={order.sketchUrl} className="w-16 h-16 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-white truncate">
                      {order.clientName || 'Без имени'}
                    </h3>
                    <span
                      className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        ORDER_STATUS_COLORS[order.status] || ''
                      }`}
                    >
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted mt-1 truncate">
                    📍 {formatPlacement(order.placement)} ·{' '}
                    {formatSize(order.size.height, order.size.width)}
                  </p>
                  {order.wishes && (
                    <p className="text-sm text-hint mt-1 line-clamp-2">
                      {order.wishes}
                    </p>
                  )}
                  <p className="text-xs text-hint mt-1.5">
                    {formatTimeAgo(new Date(order.createdAt))}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Модалка рассылки */}
      <Modal
        isOpen={broadcastOpen}
        onClose={() => setBroadcastOpen(false)}
        title="Рассылка клиентам"
        footer={
          <>
            <Button variant="secondary" onClick={() => setBroadcastOpen(false)}>
              Отменить
            </Button>
            <Button variant="primary" onClick={handleBroadcast} isLoading={broadcasting}>
              Отправить
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted mb-3">
          Сообщение получат все клиенты, оставлявшие заявку.
        </p>
        <Input
          multiline
          rows={4}
          maxLength={500}
          placeholder="Текст рассылки..."
          value={broadcastText}
          onChange={(e) => setBroadcastText(e.target.value.slice(0, 500))}
        />
        <p className="text-xs text-hint mt-2">
          Сообщение придёт в Telegram каждому клиенту, оставлявшему заявку.
        </p>
      </Modal>
    </div>
  );
};
