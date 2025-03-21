import React from 'react';
import { useChat } from './ChatContext';
import './styles.css';

interface ChatButtonProps {
  isAnalysisComplete: boolean;
}

export const ChatButton: React.FC<ChatButtonProps> = ({ isAnalysisComplete }) => {
  const { toggleChat, isChatOpen, isLoading } = useChat();

  if (!isAnalysisComplete) {
    return null;
  }

  // Apply loading class when a message is being processed
  const buttonClassName = `chat-button ${isLoading ? 'loading' : ''}`;

  return (
    <button 
      className={buttonClassName}
      onClick={toggleChat}
      aria-label={isChatOpen ? "Close chat assistant" : "Open chat assistant"}
      title={isChatOpen ? "Close chat assistant" : "Open chat assistant"}
    >
      <img src="/aws-wa-logo.png" alt="Chat with Analyzer Assistant" />
    </button>
  );
};