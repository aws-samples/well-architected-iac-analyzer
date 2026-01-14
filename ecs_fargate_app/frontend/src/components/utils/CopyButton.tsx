/**
 * IMPORTANT NOTE: 
 * This component implements a fallback mechanism for clipboard operations because
 * this application supports local development and deployment scenarios where HTTPS
 * is not available. The modern Clipboard API requires a secure context (HTTPS),
 * so we provide a fallback using the legacy document.execCommand('copy') method
 * when running in non-secure contexts (HTTP).
 * 
 * If you're always deploying to HTTPS environments, you might want to use the
 * native Clipboard API directly or consider using Cloudscape's CopyToClipboard
 * component instead.
 * 
 * Technical Context:
 * - In secure contexts (HTTPS): Uses navigator.clipboard.writeText()
 * - In non-secure contexts (HTTP): Falls back to document.execCommand('copy')
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand
 */

import { FC, useState } from 'react';
import { Button, Popover, StatusIndicator } from '@cloudscape-design/components';
import { useLanguage } from '../../contexts/LanguageContext';

interface CopyButtonProps {
  content: string;
}

const CopyButton: FC<CopyButtonProps> = ({ content }) => {
  const [copyStatus, setCopyStatus] = useState<'success' | 'error'>('success');
  const { strings } = useLanguage();

  const handleCopy = async () => {
    try {
      // Try modern clipboard API first
      if (window.isSecureContext && navigator.clipboard) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback to execCommand
        const textarea = document.createElement('textarea');
        textarea.value = content;
        textarea.style.position = 'absolute';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (!successful) throw new Error('Copy failed');
      }

      // Show success popover
      setCopyStatus('success');
    } catch (err) {
      // Show error popover
      setCopyStatus('error');
    }
  };

  return (
    <Popover
      dismissButton={false}
      position="top"
      size="small"
      triggerType="custom"
      content={
        <StatusIndicator type={copyStatus}>
          {copyStatus === 'success' ? strings.common.contentCopied : strings.common.failedToCopy}
        </StatusIndicator>
      }
    >
      <Button
        iconName="copy"
        onClick={handleCopy}
        ariaLabel={strings.common.copy}
      >
        {strings.common.copy}
      </Button>
    </Popover>
  );
};

export default CopyButton;