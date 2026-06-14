/**
 * pages/master/Dashboard.tsx
 * Кабинет мастера - список новых заявок
 */

import React, { useEffect } from 'react';
import { useMasterStore, useFilteredOrders } from '../../store';
import { orderService } from '../../services';
import { useNav } from '../../hooks';
import { LoadingSpinner, Card, Badge } from '../../components/ui';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { formatTimeAgo, formatSize } from '../../utils';
import { seedMasterDashboard } from '../../api/mock';
import { MASTER_ROUTES } from '../../routes';

export const MasterDashboard: React.FC = () => {
  const setOrders = useMasterStore((state) => state.setOrders);
  const setLoadingOrders = useMasterStore((state) => state.setLoadingOrders);
  const setSelectedOrder = useMasterStore((state) => state.setSelectedOrder);
  const filteredOrders = useFilteredOrders();
  const isLoading = useMasterStore((state) => state.isLoadingOrders);
  const { navigate } = useNav();

  useEffect(() => {
    // Загружаем заявки при монтировании
    const loadOrders = async () => {
      setLoadingOrders(true);

      // Заполняем mock данные (только в development)
      seedMasterDashboard();

      try {
        const response = await orderService.getMasterOrders('pending');

        if (response.success) {
          setOrders(response.data);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
      } finally {
        setLoadingOrders(false);
      }
    };

    loadOrders();
  }, [setOrders, setLoadingOrders]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrder(orderId);
    navigate(MASTER_ROUTES.ORDER_DETAIL.replace(':orderId', orderId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Загрузка заявок..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">
          Новые заявки
        </h1>
        <p className="text-muted mt-2">
          {filteredOrders.length} заявка{filteredOrders.length === 1 ? '' : 'и'}
        </p>
      </div>

      {/* Orders list */}
      {filteredOrders.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-muted">
            Новых заявок нет
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card
              key={order.id}
              interactive
              onClick={() => handleSelectOrder(order.id)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* Sketch preview */}
                <div className="w-20 h-20 bg-card-2 rounded-lg flex-shrink-0 overflow-hidden">
                  {order.sketchUrl && (
                    <img
                      src={order.sketchUrl}
                      alt="Sketch"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Order info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {order.clientName}
                    </h3>
                    <Badge
                      variant="default"
                      className={ORDER_STATUS_COLORS[order.status]}
                    >
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <p className="text-sm text-muted">
                      📍 {order.placement} • {formatSize(order.size.height, order.size.width)}
                    </p>
                    <p className="text-sm text-muted truncate">
                      {order.wishes}
                    </p>
                    <p className="text-xs text-hint mt-2">
                      {formatTimeAgo(order.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
