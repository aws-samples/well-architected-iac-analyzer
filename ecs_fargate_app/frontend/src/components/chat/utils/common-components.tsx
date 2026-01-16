import React, { forwardRef } from 'react';
import Avatar from '@cloudscape-design/chat-components/avatar';
import ButtonGroup from '@cloudscape-design/components/button-group';
import StatusIndicator from '@cloudscape-design/components/status-indicator';
import { AuthorAvatarProps } from './config';
import { useLanguage } from '../../../contexts/LanguageContext';

export function ChatBubbleAvatar({ type, name, initials, loading }: AuthorAvatarProps) {
    if (type === 'gen-ai') {
        return <Avatar color="gen-ai" iconName="gen-ai" ariaLabel={name} loading={loading} />;
    }

    return <Avatar initials={initials} ariaLabel={name} />;
}

export const ScrollableContainer = forwardRef(function ScrollableContainer(
    { children }: { children: React.ReactNode },
    ref: React.Ref<HTMLDivElement>,
) {
    return (
        <div style={{ position: 'relative', blockSize: '100%' }}>
            <div
                style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
                ref={ref}
                data-testid="chat-scroll-container"
            >
                {children}
            </div>
        </div>
    );
});

export function Actions({ content, authorId }: { content: string, authorId: string }) {
    const { strings } = useLanguage();
    
    // Only show copy actions for gen-ai messages
    if (authorId !== 'gen-ai') {
        return null;
    }

    return (
        <ButtonGroup
            variant="icon"
            onItemClick={({ detail }) => {
                if (detail.id !== 'copy' || !navigator.clipboard) {
                    return;
                }

                navigator.clipboard.writeText(content).catch(error =>
                    console.error('Failed to copy', error.message)
                );
            }}
            items={[
                {
                    type: 'icon-button',
                    id: 'copy',
                    iconName: 'copy',
                    text: strings.common.copy,
                    popoverFeedback: <StatusIndicator type="success">{strings.common.messageCopied}</StatusIndicator>,
                },
            ]}
        />
    );
}