/**
 * pages/client/SketchUpload.tsx
 * Экран загрузки эскиза (Шаг 0 формы)
 */

import React, { useState } from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { FileUpload } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath } from '../../routes';
import { uploadService } from '../../services';
import { useNotification } from '../../store';

export const SketchUpload: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();
  const notify = useNotification();
  const [isLoading, setIsLoading] = useState(false);

  const handleFileSelect = async (file: File | null) => {
    if (file) {
      setIsLoading(true);
      try {
        // Загружаем файл на сервер (или в mock storage)
        const response = await uploadService.uploadFile(file);

        if (response.success && response.data) {
          // Сохраняем файл и URL в form store
          form.setSketch(file);
          notify.success('Эскиз загружен успешно');
          setIsLoading(false);
        } else {
          notify.error(
            response.error?.message || 'Ошибка при загрузке файла'
          );
          setIsLoading(false);
        }
      } catch (error) {
        notify.error('Ошибка при загрузке файла');
        setIsLoading(false);
      }
    } else {
      form.setSketch(null);
    }
  };

  const handleNext = () => {
    if (!form.validateCurrentStep()) {
      return;
    }

    const nextPath = getNextFormStepPath(form.currentStep);
    if (nextPath) {
      navigate(nextPath);
    }
  };

  const handlePrev = () => {
    navigate('/');
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1">
        <FormHeader
          title="Загрузите эскиз"
          pageTitle="Эскиз"
          subtitle="Прикрепите изображение желаемой татуировки"
          step={form.currentStep}
          totalSteps={7}
          onBack={handlePrev}
        />

        <FileUpload
          accept="image/jpeg,image/png,image/webp"
          onFileSelect={handleFileSelect}
          file={form.sketch}
          error={form.errors.sketch}
        />
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={!form.sketch}
        isNextLoading={isLoading}
        showNext
        showPrev={false}
      />
    </div>
  );
};
