import React, { useState, useEffect } from 'react';
import { Select, FormField, Link, Spinner, SelectProps } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { analyzerApi } from '../services/api';
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
  const [isLoading, setIsLoading] = useState(true);
  const [options, setOptions] = useState<SelectProps.Option[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { strings } = useLanguage();

  useEffect(() => {
    const fetchWorkloads = async () => {
      setIsLoading(true);
      try {
        const workloads = await analyzerApi.listWorkloads();

        // Filter out any workloads that are created/used temporarily by the IaC Analyzer processes
        const filteredWorkloads = workloads.filter(workload => {
          return !(
            workload.WorkloadName.startsWith('DO-NOT-DELETE_WAIaCAnalyzerApp') ||
            workload.WorkloadName.startsWith('DO_NOT_DELETE_temp_IaCAnalyzer')
          );
        });

        // Start with a "Select a workload ID (optional)" option that has empty value
        const workloadOptions: SelectProps.Option[] = [
          {
            label: strings.descriptions.workloadIdInputDefaultLabel,
            value: "",
            description: strings.descriptions.workloadIdInputDefaultDescription
          }
        ];

        // Add workloads from the API (using filtered list)
        const apiWorkloadOptions = filteredWorkloads.map(workload => ({
          label: workload.WorkloadName,
          value: workload.WorkloadId,
          description: workload.WorkloadArn
        }));

        // Combine None option with API workloads
        setOptions([...workloadOptions, ...apiWorkloadOptions]);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch workloads:', error);
        setError('Failed to load workloads. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkloads();
  }, []);

  // Find the selected option - could be a workload ID or the empty value
  const selectedOption = value
    ? options.find(option => option.value === value)
    : options.find(option => option.value === "");

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
          </Link>
        </>
      }
      errorText={error}
    >
      {isLoading ? (
        <Spinner size="normal" />
      ) : (
        <Select
          selectedOption={selectedOption || null}
          onChange={({ detail }) => onChange(detail.selectedOption?.value as string || '')}
          options={options}
          placeholder={optional ? strings.descriptions.workloadIdInputDefaultLabel : "Select a workload ID"}
          disabled={disabled}
          filteringType="auto"
          expandToViewport
          empty={strings.descriptions.workloadIdInputNoWorkloadFound}
        />
      )}
    </FormField>
  );
};
