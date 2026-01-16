import React from 'react';
import ReactMarkdown from 'react-markdown';
import {
    Modal,
    Box,
    SpaceBetween,
    Button,
    Alert
} from '@cloudscape-design/components';
import CopyButton from './utils/CopyButton';
import CodeBlock from './utils/CodeBlock';
import { useLanguage } from '../contexts/LanguageContext';

interface DetailsModalProps {
    visible: boolean;
    onDismiss: () => void;
    content: string;
    error?: string | undefined;
    originalFileName?: string;
    lensAlias?: string;
}

export const DetailsModal: React.FC<DetailsModalProps> = ({
    visible,
    onDismiss,
    content,
    error,
    originalFileName = 'unknown_file',
    lensAlias = 'unknown_lens'
}) => {
    const { strings } = useLanguage();
    
    const handleDownload = () => {
        const safeFileName = originalFileName.replace(/\./g, '_');
        
        const newFileName = `IaCAnalyzer_${lensAlias}_Recommendation_Details_${safeFileName}.md`;
        
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = newFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };

    return (
        <Modal
            visible={visible}
            onDismiss={onDismiss}
            header={strings.common.detailedAnalysis}
            size="large"
            footer={
                <Box float="right">
                    <SpaceBetween direction="horizontal" size="xs">
                        <CopyButton content={content} />
                        <Button onClick={handleDownload}>
                            {strings.common.download}
                        </Button>
                        <Button variant="primary" onClick={onDismiss}>
                            {strings.common.close}
                        </Button>
                    </SpaceBetween>
                </Box>
            }
        >
            <Box padding="s">
                {error && (
                    <Alert
                        type="warning"
                        dismissible
                        header="Partial Results"
                    >
                        {error}
                    </Alert>
                )}
                <ReactMarkdown
                    components={{
                        code: CodeBlock
                    }}
                >
                    {content}
                </ReactMarkdown>
            </Box>
        </Modal>
    );
};