import React, { useRef, useEffect, useState } from 'react';
import { Rnd } from 'react-rnd';
import PromptInput from '@cloudscape-design/components/prompt-input';
import { useChat } from './ChatContext';
import ChatMessage from './ChatMessage';
import Container from '@cloudscape-design/components/container';
import SpaceBetween from '@cloudscape-design/components/space-between';
import SupportPromptGroup from '@cloudscape-design/chat-components/support-prompt-group';
import { ScrollableContainer } from './utils/common-components';
import { SupportPrompt } from './types';
import Spinner from '@cloudscape-design/components/spinner';
import Box from '@cloudscape-design/components/box';
import { Icon } from '@cloudscape-design/components';
import './styles.css';

interface ChatWindowProps {
    isAnalysisComplete: boolean;
    fileId?: string;
    lensName?: string;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ isAnalysisComplete, fileId, lensName }) => {
    const { messages, sendMessage, isChatOpen, toggleChat, isLoading: isSendingMessage, loadChatHistory, isLoadingMessages } = useChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef<HTMLDivElement | null>(null);
    const [supportPrompts, setSupportPrompts] = useState<SupportPrompt[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [animationState, setAnimationState] = useState('');

    // Default and expanded size configurations
    const defaultSize = {
        width: 500,
        height: 500
    };

    // Track position and size
    const [position, setPosition] = useState({
        x: window.innerWidth - 520,
        y: window.innerHeight - 590
    });
    const [size, setSize] = useState({
        width: defaultSize.width,
        height: defaultSize.height
    });

    const expandedSize = {
        width: window.innerWidth - 40, // 20px margin on each side
        height: window.innerHeight - 40 // 20px margin on top and bottom
    };

    // Position calculation for expanded view (center of screen)
    const expandedPosition = {
        x: 20,
        y: 20
    };

    // Ensure the chat window is always within the viewport
    const ensureVisiblePosition = (pos: any, windowSize: any) => {
        const maxX = window.innerWidth - windowSize.width;
        const maxY = window.innerHeight - windowSize.height;

        return {
            x: Math.max(0, Math.min(pos.x, maxX)),
            y: Math.max(0, Math.min(pos.y, maxY))
        };
    };

    // Handle animation state for opening/closing
    useEffect(() => {
        if (isChatOpen) {
            setAnimationState('entering');

            // Ensure the window is visible when opened
            const adjustedPosition = ensureVisiblePosition(position, size);
            if (adjustedPosition.x !== position.x || adjustedPosition.y !== position.y) {
                setPosition(adjustedPosition);
            }
        } else {
            // Only set exiting if we were previously open
            if (animationState === 'entering') {
                setAnimationState('exiting');
                // Reset animation state after animation completes
                const timer = setTimeout(() => {
                    setAnimationState('');
                }, 400); // To control longest animation duration
                return () => clearTimeout(timer);
            }
        }
    }, [isChatOpen]);

    // Add window resize listener to keep chat window in viewport
    useEffect(() => {
        const handleResize = () => {
            if (isChatOpen) {
                // If expanded, update the expanded size and position
                if (isExpanded) {
                    setSize({
                        width: window.innerWidth - 40,
                        height: window.innerHeight - 40
                    });
                    setPosition({
                        x: 20,
                        y: 20
                    });
                } else {
                    // For normal mode, ensure the window is visible with current size
                    const adjustedPosition = ensureVisiblePosition(position, size);
                    if (adjustedPosition.x !== position.x || adjustedPosition.y !== position.y) {
                        setPosition(adjustedPosition);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isChatOpen, isExpanded, position, size]);

    // Wrapper function for toggleChat to handle animation
    const handleClose = () => {
        setAnimationState('exiting');
        // Delay the actual toggle to allow animation to complete
        setTimeout(() => {
            toggleChat();
        }, 300);
    };

    // Explicitly trigger chat history load when fileId changes
    useEffect(() => {
        if (fileId && isChatOpen) {
            // Pass the explicit fileId to loadChatHistory
            if (loadChatHistory) {
                loadChatHistory(fileId);
            }
        }
    }, [fileId, isChatOpen, loadChatHistory]);

    // Scroll to bottom of messages when new messages are added
    useEffect(() => {
        if (isChatOpen && messagesEndRef.current && !isLoadingMessages) {
            messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
        }
    }, [messages, isChatOpen, isLoadingMessages]);

    // Expose setSupportPrompts function to be called externally
    useEffect(() => {
        if (isChatOpen) {
            // Attach the setSupportPrompts function to the component element
            const chatWindowElement = document.querySelector('[data-component="chat-window"]');
            if (chatWindowElement) {
                (chatWindowElement as any).__setSupportPrompts = (prompts: SupportPrompt[]) => {
                    setSupportPrompts(prompts);
                };
            }
        }

        // Cleanup function to remove the exposed function
        return () => {
            const chatWindowElement = document.querySelector('[data-component="chat-window"]');
            if (chatWindowElement) {
                delete (chatWindowElement as any).__setSupportPrompts;
            }
        };
    }, [isChatOpen]);

    // Reset supportPrompts when chat is closed
    useEffect(() => {
        if (!isChatOpen) {
            setSupportPrompts([]);
        }
    }, [isChatOpen]);

    // Toggle expanded state
    const toggleExpanded = () => {
        if (!isExpanded) {
            // Expanding
            setPosition(expandedPosition);
            setSize(expandedSize);
        } else {
            // Collapsing - ensure it's still within viewport
            const newPosition = { x: window.innerWidth - 520, y: window.innerHeight - 590 };
            const adjustedPosition = ensureVisiblePosition(newPosition, defaultSize);
            setPosition(adjustedPosition);
            setSize({ width: defaultSize.width, height: defaultSize.height });
        }
        setIsExpanded(prev => !prev);
    };

    // Convert legacy message format to new format
    const formattedMessages = messages.map(msg => ({
        id: msg.id,
        type: 'chat-bubble' as const,
        authorId: msg.isUser ? 'user' : 'gen-ai',
        content: msg.content,
        timestamp: msg.timestamp,
        isLoading: msg.isLoading,
    }));

    const handleSend = ({ detail }: { detail: { value: string } }) => {
        const message = detail.value.trim();
        if (message && !isSendingMessage && fileId) {
            sendMessage(message, fileId);
            setInputValue('');
            setSupportPrompts([]);
        }
    };

    const handleSupportPromptClick = ({ detail }: { detail: { id: string } }) => {
        // Find the prompt text by id
        const promptText = supportPrompts.find(prompt => prompt.id === detail.id)?.text;
        if (promptText && fileId) {
            sendMessage(promptText, fileId);
            // Clear the support prompts after clicking one
            setSupportPrompts([]);
        }
    };

    if (!isAnalysisComplete || !isChatOpen) {
        return null;
    }

    // Don't render anything when not open and not animating
    if (!isChatOpen && animationState !== 'exiting') return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 9999 }} className={`chat-window-animation-container ${animationState}`} data-component="chat-window">
            <Rnd
                size={{ width: size.width, height: size.height }}
                position={{ x: position.x, y: position.y }}
                onDragStop={(_, d) => {
                    const adjustedPosition = ensureVisiblePosition({ x: d.x, y: d.y }, size);
                    setPosition(adjustedPosition);
                }}
                onResizeStop={(_, __, ref, ___, position) => {
                    const newSize = {
                        width: parseInt(ref.style.width),
                        height: parseInt(ref.style.height)
                    };
                    setSize(newSize);

                    // Ensure position is still valid after resize
                    const adjustedPosition = ensureVisiblePosition(position, newSize);
                    setPosition(adjustedPosition);
                }}
                minWidth={280}
                minHeight={320}
                maxWidth={window.innerWidth}
                maxHeight={window.innerHeight}
                bounds="window"
                dragHandleClassName="chat-window-header"
                style={{ pointerEvents: 'auto' }}
                z={10000}
                resizeHandleStyles={{
                    bottomRight: {
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        bottom: '0',
                        right: '0',
                        cursor: 'nwse-resize'
                    },
                    right: {
                        position: 'absolute',
                        right: '0',
                        width: '10px',
                        cursor: 'ew-resize'
                    },
                    bottom: {
                        position: 'absolute',
                        bottom: '0',
                        height: '10px',
                        cursor: 'ns-resize'
                    }
                }}
                resizeHandleClasses={{
                    bottomRight: 'resize-handle-corner',
                    right: 'resize-handle-right',
                    bottom: 'resize-handle-bottom'
                }}
                enableResizing={{
                    top: false,
                    right: true,
                    bottom: true,
                    left: true,
                    topRight: false,
                    bottomRight: true,
                    bottomLeft: false,
                    topLeft: false
                }}
                disableDragging={isExpanded}
            >
                <div className="chat-window-container">
                    <div className="chat-window-header">
                        <h3 className="chat-window-title">
                            <img src="/aws-wa-logo.png" alt="AWS Well-Architected logo" />
                            Analyzer Assistant
                        </h3>
                        <div className="chat-window-controls">
                            <button
                                onClick={toggleExpanded}
                                aria-label={isExpanded ? "Minimize chat window" : "Maximize chat window"}
                                className="chat-header-button"
                            >
                                <Icon name={isExpanded ? "exit-full-screen" : "full-screen"} />
                            </button>
                            <button
                                onClick={handleClose}
                                aria-label="Close chat"
                                className="chat-header-button"
                            >
                                <Icon name="close" />
                            </button>
                        </div>
                    </div>

                    <Container
                        fitHeight
                        disableContentPaddings
                        footer={
                            <div className="chat-input-container">
                                <PromptInput
                                    value={inputValue}
                                    onChange={({ detail }) => setInputValue(detail.value)}
                                    onAction={handleSend}
                                    placeholder={`Ask about your results or ${lensName} best practices...`}
                                    disabled={isSendingMessage || !fileId}
                                    actionButtonAriaLabel="Send message"
                                    actionButtonIconName="send"
                                    disableActionButton={isSendingMessage || !inputValue.trim() || !fileId}
                                    maxRows={8}
                                />
                            </div>
                        }
                    >
                        <ScrollableContainer ref={messagesEndRef}>
                            <div className="messages">
                                {isLoadingMessages ? (
                                    <div className="chat-loading-container">
                                        <Box padding="l" textAlign="center">
                                            <Spinner size="normal" />
                                            <Box padding={{ top: 'xs' }} color="text-body-secondary">
                                                Loading conversation...
                                            </Box>
                                        </Box>
                                    </div>
                                ) : (
                                    <>
                                        <SpaceBetween size="xs">
                                            {formattedMessages.map((message, index) => (
                                                <ChatMessage
                                                    key={message.id}
                                                    message={message}
                                                    hideAvatar={index > 0 &&
                                                        formattedMessages[index - 1].authorId === message.authorId
                                                    }
                                                />
                                            ))}
                                        </SpaceBetween>
                                        {supportPrompts.length > 0 && (
                                            <div className="support-prompt-group-wrapper">
                                                <SupportPromptGroup
                                                    ariaLabel="Proposed prompts"
                                                    items={supportPrompts}
                                                    onItemClick={handleSupportPromptClick}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </ScrollableContainer>
                    </Container>
                </div>
            </Rnd>
        </div>
    );
};

// Allow external control of setSupportPrompts
(ChatWindow as any).setSupportPrompts = (prompts: SupportPrompt[]) => {
    const chatWindowInstance = document.querySelector('[data-component="chat-window"]');
    if (chatWindowInstance) {
        (chatWindowInstance as any).__setSupportPrompts(prompts);
    }
};

export default ChatWindow;