import React from 'react';
import { Button } from '@cloudscape-design/components';
import { useHelpPanel } from '../../contexts/HelpPanelContext';
import { useHelpContent } from './help-content';

interface HelpButtonProps {
  contentId: 'default' | 'fileUpload' | 'pillarSelection' | 'analysisResults' | 'wellArchitectedTool' | 'iacDocument' | 'workloadId' | 'iacTypeSelection' | 'supportingDocument' | 'lensSelection';
}

export const HelpButton: React.FC<HelpButtonProps> = ({ contentId }) => {
  const { setHelpContent } = useHelpPanel();
  const helpContent = useHelpContent();
  const content = helpContent[contentId];

  return (
    <Button
      variant="inline-icon"
      iconName="support"
      onClick={() => setHelpContent(content.header, content.body)}
      ariaLabel={`Help for ${content.header}`}
    />
  );
};