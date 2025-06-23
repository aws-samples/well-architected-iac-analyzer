import React from 'react';
import ChatBubble from '@cloudscape-design/chat-components/chat-bubble';
import FileTokenGroup from '@cloudscape-design/components/file-token-group';
import SpaceBetween from '@cloudscape-design/components/space-between';
import { Message } from './types';
import { ChatBubbleAvatar, Actions } from './utils/common-components';
import { Box } from '@cloudscape-design/components';
import { AUTHORS, fileTokenGroupI18nStrings } from './utils/config';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../../contexts/LanguageContext';
import './styles.css';

interface ChatMessageProps {
    message: Message;
    hideAvatar?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, hideAvatar = false }) => {
    const { authorId, content, timestamp, files, isLoading } = message;
    const author = AUTHORS[authorId];
    const { strings } = useLanguage();

    return (
        <ChatBubble
            avatar={<ChatBubbleAvatar {...author} loading={isLoading} />}
            ariaLabel={`${author.name} at ${timestamp}`}
            type={authorId === 'gen-ai' ? 'incoming' : 'outgoing'}
            hideAvatar={hideAvatar}
            actions={authorId === 'gen-ai' ? <Actions content={content} authorId={authorId} /> : undefined}
            showLoadingBar={isLoading}
        >
            <SpaceBetween size="xs">
                <div>
                    {isLoading ? (
                        <Box color="text-status-inactive">{strings.chat.generatingResponse}</Box>
                    ) : authorId === 'gen-ai' ? (
                        <div className="markdown-content">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                    ) : (
                        content
                    )}
                </div>

                {files && files.length > 0 && (
                    <FileTokenGroup
                        readOnly
                        items={files.map(file => ({ file }))}
                        limit={3}
                        onDismiss={() => {/* Empty function for read-only token */ }}
                        alignment="horizontal"
                        showFileThumbnail={true}
                        i18nStrings={fileTokenGroupI18nStrings}
                    />
                )}
            </SpaceBetween>
        </ChatBubble>
    );
};

export default ChatMessage;