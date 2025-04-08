import React from 'react';
import { ChatButton } from './ChatButton';
import { ChatWindow } from './ChatWindow';

interface ChatComponentProps {
    isAnalysisComplete: boolean;
    fileId?: string;
    lensName?: string;
}

export const Chat: React.FC<ChatComponentProps> = ({ isAnalysisComplete, fileId, lensName }) => {

    if (!isAnalysisComplete) {
        return null;
    }

    return (
        <>
            <ChatButton isAnalysisComplete={isAnalysisComplete} />
            <ChatWindow isAnalysisComplete={isAnalysisComplete} fileId={fileId} lensName={lensName} />
        </>
    );
};