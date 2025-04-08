import React, { useCallback, useMemo } from 'react';
import { NonCancelableCustomEvent, Multiselect, FormField, Header } from '@cloudscape-design/components';
import type { MultiselectProps } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { WellArchitectedPillar, LensMetadata } from '../types';

interface PillarSelectorProps {
  pillars: WellArchitectedPillar[];
  selectedPillars: string[];
  onChange: (selectedPillarIds: string[]) => void;
  disabled?: boolean;
  selectedLens?: LensMetadata;
}

export const PillarSelector: React.FC<PillarSelectorProps> = ({
  pillars,
  selectedPillars,
  onChange,
  disabled = false,
  selectedLens
}) => {
  // Memoize options to prevent unnecessary recalculations
  const options = useMemo(
    () => pillars.map(pillar => ({
      label: pillar.name,
      value: pillar.id,
    })),
    [pillars]
  );

  // Memoize selected options to prevent unnecessary recalculations
  const selectedOptions = useMemo(
    () => pillars
      .filter(pillar => selectedPillars.includes(pillar.id))
      .map(pillar => ({
        label: pillar.name,
        value: pillar.id,
      })),
    [pillars, selectedPillars]
  );

  // Memoize onChange handler
  const handleChange = useCallback(
    (event: NonCancelableCustomEvent<MultiselectProps.MultiselectChangeDetail>) => {
      const selectedValues = event.detail.selectedOptions
        .map(option => option.value)
        .filter((value): value is string => value !== undefined);
      onChange(selectedValues);
    },
    [onChange]
  );

  // Determine the header text based on selected lens
  const headerText = selectedLens 
    ? `2. Select the ${selectedLens.lensName} Pillars to review`
    : '2. Select the Well-Architected Pillars to review';

  return (
    <FormField
      label={
        <>
          <Header variant="h3">
            {headerText} <HelpButton contentId="pillarSelection" />
          </Header>
        </>
      }
    >
      <Multiselect
        selectedOptions={selectedOptions}
        onChange={handleChange}
        options={options}
        placeholder={selectedLens ? `Select ${selectedLens.lensName} Pillars` : "Select Well-Architected Pillars"}
        selectedAriaLabel="Selected"
        disabled={disabled}
        expandToViewport={true}
      />
    </FormField>
  );
};