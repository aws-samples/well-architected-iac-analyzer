export interface ChatMessage {
    id: string;
    content: string;
    timestamp: string;
    isUser: boolean;
    isLoading?: boolean;
}

export interface ChatContextType {
    messages: ChatMessage[];
    addMessage: (message: string, isUser: boolean) => ChatMessage;
    sendMessage: (message: string, explicitFileId?: string) => Promise<void>;
    isChatOpen: boolean;
    toggleChat: () => void;
    isLoading: boolean;
    clearMessages: () => void;
    loadChatHistory: (explicitFileId?: string) => Promise<void>;
    downloadChatHistory: (explicitFileId?: string) => Promise<void>;
    deleteChatHistory: (explicitFileId?: string) => Promise<void>;
    hasChatHistory: boolean;
    openChatWithPrompt: (prompt: string) => void;
    openChatWithSupportPrompt: (prompt: string, id?: string) => void;
    isLoadingMessages: boolean;
    lensName?: string;
}

export type Message = {
    id: string;
    type: 'chat-bubble';
    authorId: string; // 'user' or 'gen-ai'
    content: string;
    timestamp: string;
    files?: File[];
    isLoading?: boolean;
    hideAvatar?: boolean;
};

export interface SupportPrompt {
    text: string;
    id: string;
}