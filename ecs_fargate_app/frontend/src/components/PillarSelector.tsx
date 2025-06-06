import React, { useCallback, useMemo } from 'react';
import { NonCancelableCustomEvent, Multiselect, FormField, Header } from '@cloudscape-design/components';
import type { MultiselectProps } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { useLanguage } from '../contexts/LanguageContext';
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
  const { strings } = useLanguage();

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
    ? `2. ${strings.pillarSelector.selectPillars} (${selectedLens.lensName})`
    : `2. ${strings.pillarSelector.selectPillars}`;

  const placeholderText = selectedLens 
    ? `${strings.pillarSelector.selectPillars} (${selectedLens.lensName})`
    : strings.pillarSelector.selectPillars;

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
        placeholder={placeholderText}
        selectedAriaLabel={strings.common.selected}
        disabled={disabled}
        expandToViewport={true}
      />
    </FormField>
  );
};
