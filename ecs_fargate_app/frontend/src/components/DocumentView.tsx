import React from 'react';
import {
    Container,
    SpaceBetween,
    Button,
    Header
} from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import CodeView from "@cloudscape-design/code-view/code-view";
import jsonHighlight from "@cloudscape-design/code-view/highlight/json";
import yamlHighlight from "@cloudscape-design/code-view/highlight/yaml";
import { IaCTemplateType } from '../types';
import CopyButton from './utils/CopyButton';

interface DocumentViewProps {
    content: string;
    fileName: string;
    selectedIaCType: IaCTemplateType;
    lensAlias?: string;
}

export const DocumentView: React.FC<DocumentViewProps> = ({
    content,
    fileName,
    selectedIaCType,
    lensAlias = 'unknown_lens',
}) => {
    const getTemplateType = (): string => {
        const match = selectedIaCType.match(/\(([^\)]+)\)/);
        return match ? match[1] : 'txt';
    }

    const handleDownload = () => {
        const safeFileName = fileName.replace(/\./g, '_');
        
        const newFileName = `IaCAnalyzer_${lensAlias}_Generated_IaC_Doc_${safeFileName}${getTemplateType()}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
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
        <Container
            header={
                <Header
                    variant="h2"
                    actions={
                        <SpaceBetween
                            direction="horizontal"
                            size="xs"
                        >
                            <CopyButton content={content} />
                            <Button
                                iconName="download"
                                onClick={handleDownload}
                                ariaLabel="Download content"
                            >
                                Download
                            </Button>
                        </SpaceBetween>
                    }
                    info={<HelpButton contentId="iacDocument" />}
                >
                    Generated IaC Document
                </Header>
            }
        >
            <SpaceBetween size="s">
                <CodeView
                    content={content}
                    highlight={
                        getTemplateType() === '.yaml' ? yamlHighlight : jsonHighlight
                    }
                    lineNumbers
                    wrapLines
                />
            </SpaceBetween>
        </Container>
    );
};