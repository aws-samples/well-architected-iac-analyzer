import React from 'react';
import { Input, FormField, Link } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { useLanguage } from '../contexts/LanguageContext';

interface WorkloadIdInputProps {
  value: string;
  onChange: (value: string) => void;
  optional?: boolean;
  disabled?: boolean;
}

export const WorkloadIdInput: React.FC<WorkloadIdInputProps> = ({
  value,
  onChange,
  optional = false,
  disabled = false,
}) => {
  const { strings } = useLanguage();

  return (
    <FormField
      label={
        <>
          Well-Architected Tool Workload Id <HelpButton contentId="workloadId" />
        </>
      }
      description={
        <>
          {optional
            ? strings.descriptions.workloadIdInput
            : 'Enter the Workload ID from your Well-Architected Tool workload.'}{' '}
          <Link
            external
            href="https://docs.aws.amazon.com/wellarchitected/latest/userguide/define-workload.html"
          >
            Learn more
          </Link>
        </>
      }
    >
      <Input
        value={value}
        onChange={event => onChange(event.detail.value)}
        placeholder={optional ? "Enter workload ID (optional)" : "Enter workload ID"}
        disabled={disabled}
      />
    </FormField>
  );
};
