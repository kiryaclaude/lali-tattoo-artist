/**
 * pages/master/OrderDetails.tsx
 * Детали заявки для мастера
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMasterStore } from '../../store';
import { orderService } from '../../services';
import { Button, Card, Badge, Modal, Input, LoadingSpinner } from '../../components/ui';
import { NumberInput } from '../../components/forms';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { formatPrice, formatPlacement, formatSize } from '../../utils';
import { useNotification } from '../../store';
import { MASTER_ROUTES } from '../../routes';

export const MasterOrderDetails: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const selectedOrder = useMasterStore((state) => state.selectedOrder);
  const updateOrderStatus = useMasterStore((state) => state.updateOrderStatus);
  const updateOrderPrice = useMasterStore((state) => state.updateOrderPrice);
  const notify = useNotification();

  const [priceModal, setPriceModal] = useState(false);
  const [priceAmount, setPriceAmount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedback, setFeedback] = useState('');

  if (!orderId || !selectedOrder) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" text="Загрузка..." />
      </div>
    );
  }

  const handleSetPrice = async () => {
    if (!priceAmount || priceAmount <= 0) {
      notify.error('Укажите корректную цену');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await orderService.setOrderPrice(
        orderId,
        { amount: priceAmount, currency: 'RUB' }
      );

      if (response.success && response.data) {
        updateOrderPrice(
          orderId,
          { amount: priceAmount, currency: 'RUB' },
          {
            amount: Math.ceil(priceAmount * 0.2),
            currency: 'RUB',
          }
        );
        notify.success('Цена установлена');
        setPriceModal(false);
        setPriceAmount(null);
      }
    } catch (error) {
      notify.error('Ошибка при установке цены');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!feedback.trim()) {
      notify.error('Укажите вопрос или уточнение');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await orderService.rejectOrder(orderId, feedback);

      if (response.success) {
        updateOrderStatus(orderId, 'awaiting_price');
        notify.success('Уточнение отправлено');
        setFeedbackModal(false);
        setFeedback('');
      }
    } catch (error) {
      notify.error('Ошибка при отправке уточнения');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Вы уверены, что хотите отклонить эту заявку?')) {
      return;
    }

    try {
      const response = await orderService.rejectOrder(
        orderId,
        'Отклонено мастером'
      );

      if (response.success) {
        notify.success('Заявка отклонена');
        navigate(MASTER_ROUTES.DASHBOARD);
      }
    } catch (error) {
      notify.error('Ошибка при отклонении заявки');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {selectedOrder.clientName}
          </h1>
          <p className="text-muted mt-1">
            {selectedOrder.clientPhone}
          </p>
        </div>
        <Badge
          variant="default"
          className={ORDER_STATUS_COLORS[selectedOrder.status]}
        >
          {ORDER_STATUS_LABELS[selectedOrder.status]}
        </Badge>
      </div>

      {/* Sketch */}
      {selectedOrder.sketchUrl && (
        <Card>
          <img
            src={selectedOrder.sketchUrl}
            alt="Sketch"
            className="w-full h-auto rounded-lg"
          />
        </Card>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-1">
            Возраст
          </p>
          <p className="text-xl font-bold text-white">
            {selectedOrder.clientAge} лет
          </p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-1">
            Расположение
          </p>
          <p className="text-lg font-bold text-white">
            {formatPlacement(selectedOrder.placement)}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-1">
            Размер
          </p>
          <p className="text-lg font-bold text-white">
            {formatSize(selectedOrder.size.height, selectedOrder.size.width)}
          </p>
        </Card>

        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-1">
            Опыт
          </p>
          <p className="text-lg font-bold text-white">
            {selectedOrder.experience.hasTattoos
              ? `${selectedOrder.experience.tattooCount || 1} тату`
              : 'Первая'}
          </p>
        </Card>
      </div>

      {/* Wishes */}
      {selectedOrder.wishes && (
        <Card>
          <p className="text-xs font-semibold text-muted uppercase mb-2">
            Пожелания клиента
          </p>
          <p className="text-white">
            {selectedOrder.wishes}
          </p>
        </Card>
      )}

      {/* Actions */}
      {selectedOrder.status === 'pending' && (
        <div className="flex gap-3">
          <Button
            variant="primary"
            fullWidth
            onClick={() => setPriceModal(true)}
          >
            Назначить стоимость
          </Button>
          <Button
            variant="secondary"
            fullWidth
            onClick={() => setFeedbackModal(true)}
          >
            Запросить уточнение
          </Button>
          <Button
            variant="danger"
            onClick={handleReject}
          >
            Отклонить
          </Button>
        </div>
      )}

      {/* Price Modal */}
      <Modal
        isOpen={priceModal}
        onClose={() => setPriceModal(false)}
        title="Назначить стоимость"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setPriceModal(false)}
            >
              Отменить
            </Button>
            <Button
              variant="primary"
              onClick={handleSetPrice}
              isLoading={isSubmitting}
            >
              Установить цену
            </Button>
          </>
        }
      >
        <NumberInput
          label="Стоимость работы (₽)"
          value={priceAmount}
          onChange={setPriceAmount}
          min={1000}
          max={100000}
          step={1000}
        />
      </Modal>

      {/* Feedback Modal */}
      <Modal
        isOpen={feedbackModal}
        onClose={() => setFeedbackModal(false)}
        title="Запросить уточнение"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setFeedbackModal(false)}
            >
              Отменить
            </Button>
            <Button
              variant="primary"
              onClick={handleRequestClarification}
              isLoading={isSubmitting}
            >
              Отправить
            </Button>
          </>
        }
      >
        <Input
          label="Ваше сообщение"
          placeholder="Что вас уточнить?"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
        />
      </Modal>
    </div>
  );
};
