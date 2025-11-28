import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  path: '/socket.io/', // Explicitly set the path
  pingInterval: 10000, // Send ping every 10 seconds
  pingTimeout: 5000,   // Wait 5 seconds for pong response
})
export class AnalyzerGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AnalyzerGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitAnalysisProgress(data: {
    processedQuestions: number;
    totalQuestions: number;
    currentPillar: string;
  }) {
    this.server.emit('analysisProgress', data);
  }

  emitImplementationProgress(data: {
    status: string;
    progress: number;
  }) {
    this.server.emit('implementationProgress', data);
  }
}