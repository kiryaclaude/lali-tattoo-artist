/**
 * pages/client/ExperienceSelect.tsx
 * Экран выбора опыта татуировок (Шаг 5 формы)
 */

import React from 'react';
import { useForm } from '../../hooks';
import { FormHeader, FormFooter } from '../../components/common';
import { SegmentedControl, NumberInput } from '../../components/forms';
import { useNav } from '../../hooks';
import { getNextFormStepPath, getPrevFormStepPath } from '../../routes';

export const ExperienceSelect: React.FC = () => {
  const form = useForm();
  const { navigate } = useNav();

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
    const prevPath = getPrevFormStepPath(form.currentStep);
    if (prevPath) {
      navigate(prevPath);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 space-y-6">
        <FormHeader
          title="Есть ли у вас опыт татуировок?"
          pageTitle="Опыт"
          step={form.currentStep}
          totalSteps={7}
          onBack={handlePrev}
        />

        <SegmentedControl
          options={[
            { id: 'true', label: 'Да' },
            { id: 'false', label: 'Нет' },
          ]}
          value={form.hasTattoos === null ? null : form.hasTattoos ? 'true' : 'false'}
          onChange={(value) => form.setHasTattoos(value === 'true')}
          columns={2}
          error={form.errors.hasTattoos}
        />

        {/* Show tattoo count if has experience */}
        {form.hasTattoos && (
          <NumberInput
            label="Сколько у вас тату?"
            value={form.tattooCount}
            onChange={form.setTattooCount}
            min={1}
            max={50}
          />
        )}
      </div>

      <FormFooter
        onNext={handleNext}
        onPrev={handlePrev}
        isNextDisabled={form.hasTattoos === null}
        showNext
        showPrev
      />
    </div>
  );
};
