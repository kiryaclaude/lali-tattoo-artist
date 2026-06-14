/**
 * pages/client/WishesInput.tsx
 * Экран ввода пожеланий (Шаг 6 формы, последний перед отправкой)
 */

import React, { useState } from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { Input, Card } from '../../components/ui';
import { useNav } from '../../hooks';
import { getPrevFormStepPath, CLIENT_ROUTES } from '../../routes';
import { useAppStore, useNotification } from '../../store';
import { orderService } from '../../services';

export const WishesInput: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();
  const notify = useNotification();
  const setLoading = useAppStore((state) => state.setLoading);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setLoading(true);

    try {
      // clientId и проверку лимита делает сервер по Telegram initData
      const orderData = {
        clientName: form.clientName,
        clientPhone: form.clientPhone,
        clientAge: form.clientAge!,
        placement: form.placement!,
        size: form.size!,
        sketchUrl: 'mock-sketch-url',
        health: {
          contraindications: form.contraindications,
          otherHealth: form.otherHealth,
        },
        experience: {
          hasTattoos: form.hasTattoos!,
          tattooCount: form.tattooCount,
        },
        wishes: form.wishes,
        status: 'pending' as const,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success && response.data) {
        notify.success('Заявка отправлена успешно!');
        form.resetForm();
        navigate(CLIENT_ROUTES.FORM_SUCCESS);
      } else {
        const msg =
          (response as { message?: string }).message ||
          response.error?.message ||
          'Ошибка при отправке заявки';
        notify.error(msg);
      }
    } catch (error) {
      notify.error('Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handlePrev = () => {
    const prevPath = getPrevFormStepPath(form.currentStep);
    if (prevPath) {
      navigate(prevPath);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title="Дополнительная информация"
          pageTitle="Пожелания"
          subtitle="Необязательно, но поможет мастеру лучше понять ваш проект"
          step={form.currentStep}
          totalSteps={7}
          onBack={handlePrev}
        />

        <Input
          label="Ваши пожелания и детали"
          placeholder="Например: хочу реалистичную розу в чёрно-серых тонах, без белых бликов..."
          value={form.wishes}
          onChange={(e) => form.setWishes(e.target.value.slice(0, 500))}
          multiline
          rows={5}
          maxLength={500}
        />

        <Card className="bg-brand-tint border-brand/30">
          <div className="flex gap-3">
            <div className="text-brand-light flex-shrink-0">ℹ️</div>
            <p className="text-sm text-brand-light">
              После отправки мастер изучит вашу заявку и рассчитает стоимость индивидуально.
            </p>
          </div>
        </Card>
      </div>

      <FormFooter
        onSubmit={handleSubmit}
        onPrev={handlePrev}
        isNextDisabled={false}
        isNextLoading={isSubmitting}
        showSubmit
        showNext={false}
        showPrev
        submitLabel="Отправить заявку"
      />
    </div>
  );
};
