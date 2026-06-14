/**
 * pages/client/HealthSelect.tsx
 * Экран выбора противопоказаний (Шаг 4 формы)
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { CheckboxGroup, Input } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';
import { CONTRAINDICATION_OPTIONS } from '../../constants';

export const HealthSelect: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();

  const options = CONTRAINDICATION_OPTIONS.map((label) => ({
    id: label,
    label,
  }));

  const handleNext = () => {
    const nextPath = getNextFormStepPath(form.currentStep);
    if (nextPath) {
      navigate(nextPath);
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
          title="Есть ли противопоказания?"
          pageTitle="Здоровье"
          subtitle="Выберите всё, что относится к вам"
          step={form.currentStep}
          totalSteps={7}
          onBack={handlePrev}
        />

        <CheckboxGroup
          options={options}
          value={form.contraindications}
          onChange={form.setContraindications}
        />

        <Input
          label="Другие особенности здоровья (необязательно)"
          placeholder="Укажите дополнительную информацию..."
          value={form.otherHealth}
          onChange={(e) => form.setOtherHealth(e.target.value.slice(0, 300))}
          multiline
          rows={3}
          maxLength={300}
        />
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        showNext
        showPrev
      />
    </div>
  );
};
