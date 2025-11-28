import { io, Socket } from 'socket.io-client';

class SocketService {
    private socket: Socket | null = null;

    connect() {
        if (!this.socket) {
            // Use relative URL to connect to the same host
            const baseUrl = window.location.origin;

            this.socket = io(baseUrl, {
                path: '/socket.io/',
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            this.socket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });

            this.socket.on('reconnect_error', (error) => {
                console.error('Socket reconnection error:', error);
            });
        }
        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    onAnalysisProgress(callback: (data: {
        processedQuestions: number;
        totalQuestions: number;
        currentPillar: string;
    }) => void) {
        const socket = this.connect();
        socket.on('analysisProgress', callback);
        return () => socket.off('analysisProgress', callback);
    }

    onImplementationProgress(callback: (data: {
        status: string;
        progress: number;
    }) => void) {
        const socket = this.connect();
        socket.on('implementationProgress', callback);
        return () => socket.off('implementationProgress', callback);
    }
}

export const socketService = new SocketService();