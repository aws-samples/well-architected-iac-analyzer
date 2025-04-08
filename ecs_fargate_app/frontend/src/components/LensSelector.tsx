import React, { useEffect, useState } from 'react';
import { Select, FormField, Spinner, SelectProps } from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { LensMetadata } from '../types';
import { analyzerApi } from '../services/api';

interface LensSelectorProps {
  value: string;
  onChange: (value: string, lensMetadata: LensMetadata) => void;
  disabled?: boolean;
}

export const LensSelector: React.FC<LensSelectorProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [lensOptions, setLensOptions] = useState<{ label: string; value: string; description?: string }[]>([]);
  const [lensMetadataMap, setLensMetadataMap] = useState<Record<string, LensMetadata>>({});
  const [error, setError] = useState<string | null>(null);

  // Get lens metadata on component mount
  useEffect(() => {
    const fetchLensMetadata = async () => {
      setIsLoading(true);
      try {
        const lensMetadata = await analyzerApi.getLensMetadata();
        
        // Sort lenses alphabetically, but put Well-Architected Framework first
        const sortedLensMetadata = lensMetadata.sort((a, b) => {
          if (a.lensName === 'Well-Architected Framework') return -1;
          if (b.lensName === 'Well-Architected Framework') return 1;
          return a.lensName.localeCompare(b.lensName);
        });
        
        // Create options for select component
        const options = sortedLensMetadata.map(lens => ({
          label: lens.lensName,
          value: lens.lensAlias, // This is the Alias in its ARN form e.g. 'arn:aws:wellarchitected::aws:lens/wellarchitected'
          description: lens.lensDescription
        }));
        
        // Create map for easy lookup
        const metadataMap = sortedLensMetadata.reduce<Record<string, LensMetadata>>(
          (map, lens) => {
            map[lens.lensAlias] = lens;
            return map;
          },
          {}
        );
        
        setLensOptions(options);
        setLensMetadataMap(metadataMap);
        
        // If no lens is selected yet, default to Well-Architected Framework
        if (!value && options.length > 0) {
          const defaultLens = options.find(opt => opt.label === 'Well-Architected Framework') || options[0];
          onChange(defaultLens.value, metadataMap[defaultLens.value]);
        }
        
      } catch (error) {
        console.error('Failed to fetch lens metadata:', error);
        setError('Failed to load lens options. Please refresh the page and try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLensMetadata();
  }, []);

  const handleLensChange: SelectProps['onChange'] = ({ detail }) => {
    if (detail.selectedOption && typeof detail.selectedOption.value === 'string') {
      onChange(detail.selectedOption.value, lensMetadataMap[detail.selectedOption.value]);
    }
  };

  return (
    <FormField
      label={
        <>
          Well-Architected Lens <HelpButton contentId="lensSelection" />
        </>
      }
      description="Select which Well-Architected lens to use for reviewing your infrastructure"
      errorText={error}
    >
      {isLoading ? (
        <Spinner size="normal" />
      ) : (
        <Select
          selectedOption={lensOptions.find(option => option.value === value) || null}
          onChange={handleLensChange}
          options={lensOptions}
          placeholder="Select a Well-Architected lens"
          disabled={disabled || isLoading}
          filteringType="auto"
          expandToViewport
        />
      )}
    </FormField>
  );
};