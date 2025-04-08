import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, ChatContextType, SupportPrompt } from './types';
import { analyzerApi } from '../../services/api';
import { storageApi } from '../../services/storage';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode, fileId?: string, lensName?: string, lensAliasArn?: string }> = ({
    children,
    fileId,
    lensName = 'Well-Architected Framework', // Default value if not provided
    lensAliasArn = 'arn:aws:wellarchitected::aws:lens/wellarchitected' // Default value if not provided
}) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [hasChatHistory, setHasChatHistory] = useState(false);
    const [currentFileId, setCurrentFileId] = useState<string | undefined>(fileId);
    const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
    const [pendingSupportPrompts, setPendingSupportPrompts] = useState<SupportPrompt[] | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    // Track when fileId changes to reset and reload chat history
    useEffect(() => {
        if (fileId !== currentFileId) {
            // Reset messages when switching to a different file
            setMessages([]);
            setHasChatHistory(false);
            setCurrentFileId(fileId);
            setIsInitialized(false);

            // If chat is open, load the history for the new file
            if (fileId && isChatOpen) {
                loadChatHistory(fileId);
            }
        }
    }, [fileId]);

    // Load chat history when component mounts
    useEffect(() => {
        if (fileId && isChatOpen && !isInitialized) {
            loadChatHistory(fileId);
            setIsInitialized(true);
        }
    }, [fileId, isChatOpen, isInitialized]);

    // Handle pending prompt after chat is opened
    useEffect(() => {
        if (isChatOpen && pendingPrompt) {
            // Send the pending prompt after a short delay to ensure the chat is fully loaded
            const timer = setTimeout(() => {
                sendMessage(pendingPrompt);
                setPendingPrompt(null);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isChatOpen, pendingPrompt]);

    // Handle pending support prompts after chat is opened
    useEffect(() => {
        if (isChatOpen && pendingSupportPrompts) {
            // Set support prompts after a short delay to ensure chat is fully loaded
            const timer = setTimeout(() => {
                // Use the setSupportPrompts function exposed by ChatWindow
                const chatWindow: any = document.querySelector('[data-component="chat-window"]');
                if (chatWindow && chatWindow.__setSupportPrompts) {
                    chatWindow.__setSupportPrompts(pendingSupportPrompts);
                }
                setPendingSupportPrompts(null);
            }, 300);

            return () => clearTimeout(timer);
        }
    }, [isChatOpen, pendingSupportPrompts]);

    // Listener for chat history deletion from outside the component
    useEffect(() => {
        const handleChatDeleted = (event: CustomEvent) => {
            const deletedFileId = event.detail?.fileId;
            if (deletedFileId && deletedFileId === fileId) {
                // Reset messages to just the welcome message
                const welcomeMessage: ChatMessage = {
                    id: uuidv4(),
                    content: "Hello! I'm your IaC Analyzer assistant. Ask me any questions about your analysis results or AWS Well-Architected Framework best practices.",
                    timestamp: new Date().toISOString(),
                    isUser: false,
                };
                setMessages([welcomeMessage]);
                setHasChatHistory(false);
            }
        };

        // Cast to any to handle CustomEvent with detail
        document.addEventListener('chatHistoryDeleted', handleChatDeleted as EventListener);

        return () => {
            document.removeEventListener('chatHistoryDeleted', handleChatDeleted as EventListener);
        };
    }, [fileId]);

    // Load chat history from storage
    const loadChatHistory = useCallback(async (explicitFileId?: string) => {
        const idToUse = explicitFileId || fileId;

        if (!idToUse) {
            console.error("Cannot load chat history: fileId is undefined");
            return;
        }

        try {
            setIsLoadingMessages(true);
            const workItem = await storageApi.getWorkItem(idToUse);

            // If workItem has chat history, load it; otherwise, create a welcome message
            if (workItem && workItem.hasChatHistory) {
                try {
                    const history = await storageApi.getChatHistory(idToUse);
                    
                    if (history && history.length > 0) {
                        setMessages(history);
                        setHasChatHistory(true);
                        setIsLoadingMessages(false);
                        return;
                    }
                    // If we don't get any history data despite the flag being true, 
                    // we'll fall through to create the welcome message
                    console.warn("workItem indicates chat history exists but none was returned");
                } catch (historyError) {
                    console.error("Error loading chat history:", historyError);
                }
            }

            // Create a welcome message
            const welcomeMessage: ChatMessage = {
                id: uuidv4(),
                content: "Hello! I'm your IaC Analyzer assistant. Ask me any questions about your analysis results or AWS Well-Architected Framework best practices.",
                timestamp: new Date().toISOString(),
                isUser: false,
            };
            setMessages([welcomeMessage]);
            setHasChatHistory(false);
            
        } catch (error) {
            console.error("Failed to load chat history:", error);
            // If error, add welcome message
            const welcomeMessage: ChatMessage = {
                id: uuidv4(),
                content: "Hello! I'm your IaC Analyzer assistant. Ask me any questions about your analysis results or AWS Well-Architected Framework best practices.",
                timestamp: new Date().toISOString(),
                isUser: false,
            };
            setMessages([welcomeMessage]);
            setHasChatHistory(false);
        } finally {
            setIsLoadingMessages(false);
        }
    }, [fileId]);

    // Open chat with a specific prompt
    const openChatWithPrompt = useCallback((prompt: string) => {
        // Store the prompt to be sent after the chat is opened
        setPendingPrompt(prompt);
        // Open the chat
        setIsChatOpen(true);
    }, []);

    // Open chat with support prompt options
    const openChatWithSupportPrompt = useCallback((prompt: string, id: string = 'best-practice-details') => {
        // Create support prompt object
        const supportPrompts: SupportPrompt[] = [{
            text: prompt,
            id: id
        }];

        // Store support prompts to be set after chat is opened
        setPendingSupportPrompts(supportPrompts);

        // Open the chat
        setIsChatOpen(true);
    }, []);

    // Download chat history
    const downloadChatHistory = useCallback(async (explicitFileId?: string) => {
        const idToUse = explicitFileId || fileId;
        if (!idToUse || messages.length === 0) return;

        try {
            await storageApi.downloadChatHistory(idToUse, idToUse);
        } catch (error) {
            console.error("Failed to download chat history:", error);
        }
    }, [fileId, messages]);

    // Delete chat history
    const deleteChatHistory = useCallback(async (explicitFileId?: string) => {
        const idToUse = explicitFileId || fileId;
        if (!idToUse) return;

        try {
            await storageApi.deleteChatHistory(idToUse);

            // Reset messages to just the welcome message
            const welcomeMessage: ChatMessage = {
                id: uuidv4(),
                content: "Hello! I'm your IaC Analyzer assistant. Ask me any questions about your analysis results or AWS Well-Architected Framework best practices.",
                timestamp: new Date().toISOString(),
                isUser: false,
            };

            setMessages([welcomeMessage]);
            setHasChatHistory(false);
        } catch (error) {
            console.error("Failed to delete chat history:", error);
        }
    }, [fileId]);

    const addMessage = useCallback((content: string, isUser: boolean) => {
        const newMessage: ChatMessage = {
            id: uuidv4(),
            content,
            timestamp: new Date().toISOString(),
            isUser,
        };
        setMessages(prev => [...prev, newMessage]);
        return newMessage;
    }, []);

    const sendMessage = useCallback(async (message: string, explicitFileId?: string) => {
        const idToUse = explicitFileId || fileId || currentFileId;
        if (!message.trim() || !idToUse) {
            console.error("Cannot send message: empty message or missing fileId", { message, fileId: idToUse });
            return;
        }

        // Add user message
        addMessage(message, true);

        // Add loading message from assistant
        const loadingMsgId = uuidv4();
        setMessages(prev => [
            ...prev,
            {
                id: loadingMsgId,
                content: "Thinking...",
                timestamp: new Date().toISOString(),
                isUser: false,
                isLoading: true
            }
        ]);

        setIsLoading(true);

        try {
            const response = await analyzerApi.sendChatMessage(idToUse, message, lensName, lensAliasArn);

            // Replace loading message with actual response
            setMessages(prev => {
                const updatedMessages = prev.map(msg =>
                    msg.id === loadingMsgId
                        ? { ...msg, content: response.content, isLoading: false }
                        : msg
                );

                // Set hasChatHistory to true since there are messages
                setHasChatHistory(true);
                
                // Store the updated messages
                if (updatedMessages.length > 1) { // Only save if there's more than just the welcome message
                    storageApi.storeChatHistory(idToUse, updatedMessages)
                        .catch(err => console.error("Failed to store chat history:", err));
                }

                return updatedMessages;
            });
        } catch (error) {
            console.error("Error sending chat message:", error);
            // Replace loading message with error message
            setMessages(prev => prev.map(msg =>
                msg.id === loadingMsgId
                    ? {
                        ...msg,
                        content: "Sorry, I encountered an error while processing your request. Please try again.",
                        isLoading: false
                    }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    }, [addMessage, fileId, currentFileId, lensName]);

    const toggleChat = useCallback(() => {
        // If user is opening the chat and it's not initialized, set isInitialized to false to trigger reload
        if (!isChatOpen && !isInitialized) {
            setIsInitialized(false);
        }

        const newChatState = !isChatOpen;
        setIsChatOpen(prev => !prev);

        // If closing the chat, clear any pending support prompts
        if (!newChatState) {
            setPendingSupportPrompts(null);

            // Clear support prompts in ChatWindow if it exists
            const chatWindow: any = document.querySelector('[data-component="chat-window"]');
            if (chatWindow && chatWindow.__setSupportPrompts) {
                chatWindow.__setSupportPrompts([]);
            }
        }
    }, [isChatOpen, isInitialized]);

    const clearMessages = useCallback(() => {
        setMessages([]);
        setHasChatHistory(false);
    }, []);

    const value: ChatContextType = {
        messages,
        addMessage,
        sendMessage,
        isChatOpen,
        toggleChat,
        isLoading,
        clearMessages,
        loadChatHistory,
        downloadChatHistory,
        deleteChatHistory,
        hasChatHistory,
        openChatWithPrompt,
        openChatWithSupportPrompt,
        isLoadingMessages,
        lensName,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = (): ChatContextType => {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};