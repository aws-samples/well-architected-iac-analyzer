import React from 'react';
import { Select, FormField } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { useLanguage } from '../contexts/LanguageContext';
import { IaCTemplateType } from '../types';

interface IaCTemplateSelectorProps {
  value: IaCTemplateType;
  onChange: (value: IaCTemplateType) => void;
  disabled?: boolean;
}

export const IaCTemplateSelector: React.FC<IaCTemplateSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { strings } = useLanguage();

  // Map template types to localized labels
  const getTemplateLabel = (templateType: IaCTemplateType): string => {
    switch (templateType) {
      case IaCTemplateType.CLOUDFORMATION_YAML:
        return strings.iacTemplateSelector.cloudFormation;
      case IaCTemplateType.TERRAFORM:
        return strings.iacTemplateSelector.terraform;
      default:
        return templateType;
    }
  };

  return (
    <FormField
      label={
        <>
          {strings.iacTemplateSelector.selectTemplate} <HelpButton contentId="iacTypeSelection" />
        </>
      }
      description="Select the type of IaC template to generate from the architectural diagrams uploaded"
    >
      <Select
        selectedOption={{ 
          label: getTemplateLabel(value), 
          value: value 
        }}
        onChange={({ detail }) =>
          onChange(detail.selectedOption.value as IaCTemplateType)
        }
        options={Object.values(IaCTemplateType).map(type => ({
          label: getTemplateLabel(type),
          value: type,
        }))}
        disabled={disabled}
      />
    </FormField>
  );
};
