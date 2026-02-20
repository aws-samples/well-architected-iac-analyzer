import { WorkItem, WorkItemResponse } from '../types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api/storage',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

export const storageApi = {
  // Supporting documents upload
  async uploadSupportingDocument(formData: FormData): Promise<{ fileId: string }> {
    try {
      // lensAlias is expected to be part of the formData now
      const response = await api.post('/work-items/upload-supporting', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload supporting document'
      );
    }
  },

  // Supporting document download
  async downloadSupportingDocument(fileId: string, mainFileId: string, fileName: string, lensAlias?: string): Promise<void> {
    try {
      // Updated endpoint to include main file ID and lens alias
      const response = await api.get(`/work-items/${mainFileId}/supporting-document/${fileId}/${lensAlias}`, {
        responseType: 'arraybuffer'
      });

      // Get the content type from headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create blob from array buffer
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to download supporting document'
      );
    }
  },

  async uploadFiles(formData: FormData): Promise<{ fileId: string; tokenCount?: number; exceedsTokenLimit?: boolean }> {
    try {
      const response = await api.post('/work-items/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to upload files'
      );
    }
  },

  async listWorkItems(): Promise<WorkItem[]> {
    try {
      const response = await api.get('/work-items');
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to list work items'
      );
    }
  },

  async getWorkItem(fileId: string, lensAliasArn?: string): Promise<WorkItemResponse> {
    try {
      const response = await api.post('/work-items/get', {
        fileId,
        lensAliasArn
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get work item'
      );
    }
  },

  async deleteWorkItem(fileId: string): Promise<void> {
    try {
      await api.delete(`/work-items/${fileId}`);
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete work item'
      );
    }
  },

  async downloadOriginalContent(fileId: string, fileName: string): Promise<void> {
    try {
      // Get the content with responseType arraybuffer for binary data
      const response = await api.get(`/work-items/${fileId}/content`, {
        responseType: 'arraybuffer'
      });

      // Get the content type from headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';

      // Create blob from array buffer
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to download original content'
      );
    }
  },

  // Get chat history
  async getChatHistory(fileId: string): Promise<any[]> {
    try {
      const response = await api.get(`/work-items/${fileId}/chat-history`);
      return response.data;
    } catch (error) {
      console.error('Failed to get chat history:', error);
      // Return empty array if there's an error
      return [];
    }
  },

  // Store chat history
  async storeChatHistory(fileId: string, messages: any[]): Promise<void> {
    try {
      const response = await api.post(`/work-items/${fileId}/chat-history`, { messages });
      return response.data;
    } catch (error) {
      console.error('Failed to store chat history:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to store chat history'
      );
    }
  },

  // Download chat history
  async downloadChatHistory(fileId: string, fileName: string): Promise<void> {
    try {
      const response = await api.get(`/work-items/${fileId}/chat-history/download`, {
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_history_${fileName.replace(/\.\w+$/, '')}.json`;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to download chat history'
      );
    }
  },

  // Delete chat history
  async deleteChatHistory(fileId: string): Promise<void> {
    try {
      await api.delete(`/work-items/${fileId}/chat-history`);
    } catch (error) {
      console.error('Delete error:', error);
      throw new Error(
        error instanceof Error ? error.message : 'Failed to delete chat history'
      );
    }
  },

  // Get analysis results 
  async getAnalysisResults(fileId: string, lensAlias: string): Promise<any> {
    try {
      const response = await api.get(`/work-items/${fileId}/analysis/${lensAlias}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get analysis results'
      );
    }
  },

  // Get IaC document
  async getIaCDocument(fileId: string, extension: string, lensAlias: string): Promise<string> {
    try {
      const response = await api.get(`/work-items/${fileId}/iac-document/${extension}/${lensAlias}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : 'Failed to get IaC document'
      );
    }
  }
};