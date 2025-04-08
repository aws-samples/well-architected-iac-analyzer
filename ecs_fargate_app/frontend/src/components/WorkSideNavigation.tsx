import { useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  SideNavigation,
  Badge,
  SpaceBetween,
  Button,
  Modal,
  Box,
  StatusIndicator,
} from '@cloudscape-design/components';
import type { BadgeProps } from '@cloudscape-design/components/badge';
import type { SideNavigationProps } from '@cloudscape-design/components/side-navigation';
import { useAuth } from '../contexts/AuthContext';
import { storageApi } from '../services/storage';
import { WorkItem, WorkItemStatus } from '../types';

export interface WorkSideNavigationProps {
  activeFileId?: string;
  onItemSelect: (workItem: WorkItem, loadResults?: boolean, lensAliasArn?: string, lensName?: string) => void;
  onSectionExpand: (workItem: WorkItem) => void;
  onResetActiveFile: () => void;
}

export interface WorkSideNavigationRef {
  loadWorkItems: () => Promise<void>;
}

export const WorkSideNavigation = forwardRef<WorkSideNavigationRef, WorkSideNavigationProps>((
  {
    activeFileId,
    onItemSelect,
    onResetActiveFile,
  },
  ref
) => {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<WorkItem | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [isReloading, setIsReloading] = useState(false);
  const { authState } = useAuth();
  const [downloadingChatHistoryId, setDownloadingChatHistoryId] = useState<string | null>(null);
  const [deletingChatHistoryId, setDeletingChatHistoryId] = useState<string | null>(null);
  const [deleteChatModalVisible, setDeleteChatModalVisible] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<WorkItem | null>(null);

  // Helper function to determine badge color based on analysis status
  const getBadgeColor = (status?: WorkItemStatus): BadgeProps['color'] => {
    switch (status) {
      case 'COMPLETED':
        return 'green';
      case 'FAILED':
        return 'red';
      case 'PARTIAL':
        return 'blue';
      case 'IN_PROGRESS':
        return 'blue';
      default:
        return 'grey';
    }
  };

  // Check if a file has chat history
  const hasChatHistory = (item: WorkItem): boolean => {
    return !!item.hasChatHistory;
  };

  const loadWorkItems = useCallback(async () => {
    setIsReloading(true);
    try {
      const workItems = await storageApi.listWorkItems();
      setSortedItems(workItems);
      onResetActiveFile();
    } catch (err) {
      console.error('Failed to load work items:', err);
    } finally {
      setIsReloading(false);
    }
  }, [onResetActiveFile]);

  useImperativeHandle(ref, () => ({
    loadWorkItems
  }), [loadWorkItems]);

  const handleDownload = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    setDownloadingFileId(item.fileId);
    try {
      await storageApi.downloadOriginalContent(item.fileId, item.fileName);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const setSortedItems = (newItems: WorkItem[]) => {
    const sortedItems = [...newItems].sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    setItems(sortedItems);
  };

  useEffect(() => {
    if (authState.isAuthenticated) {
      loadWorkItems();
    }
  }, [authState.isAuthenticated, loadWorkItems]);

  // Handle chat history download and deletion
  const handleDownloadChatHistory = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    setDownloadingChatHistoryId(item.fileId);
    try {
      await storageApi.downloadChatHistory(item.fileId, item.fileName);
    } catch (error) {
      console.error('Failed to download chat history:', error);
    } finally {
      setDownloadingChatHistoryId(null);
    }
  };

  const handleDeleteChatHistory = async (item: WorkItem, event: any) => {
    event.preventDefault();
    event.stopPropagation();

    // Keep section expanded without loading results
    onItemSelect(item, false);

    // Show modal instead of browser confirm
    setChatToDelete(item);
    setDeleteChatModalVisible(true);
  };

  const confirmChatDelete = async () => {
    if (!chatToDelete) return;

    setDeletingChatHistoryId(chatToDelete.fileId);
    try {
      await storageApi.deleteChatHistory(chatToDelete.fileId);
      
      // After deletion, reload the work items to get updated hasChatHistory flag
      await loadWorkItems();
      
      // Dispatch a custom event to notify the ChatContext about the deletion
      const chatDeletedEvent = new CustomEvent('chatHistoryDeleted', { 
        detail: { fileId: chatToDelete.fileId }
      });
      document.dispatchEvent(chatDeletedEvent);
      
      setDeleteChatModalVisible(false);
      setChatToDelete(null);
    } catch (error) {
      console.error('Failed to delete chat history:', error);
    } finally {
      setDeletingChatHistoryId(null);
    }
  };

  const handleDelete = async (item: WorkItem) => {
    setItemToDelete(item);
    setDeleteModalVisible(true);
    // Keep section expanded while deleting
    onItemSelect(item, false);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    setDeletingFileId(itemToDelete.fileId);
    try {
      await storageApi.deleteWorkItem(itemToDelete.fileId);
      await loadWorkItems();
      setDeleteModalVisible(false);
      setItemToDelete(null);
    } catch (err) {
      console.error('Failed to delete work item:', err);
    } finally {
      setDeletingFileId(null);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const pad = (num: number) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hour = pad(date.getHours());
    const minute = pad(date.getMinutes());
    const second = pad(date.getSeconds());

    return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
  };

  const navigationItems: SideNavigationProps.Item[] = [
    ...items.map(item => {
      // Create file-level items (non-lens specific)
      const fileItems = [
        // Lenses section with badges for each lens
        {
          type: 'link' as const,
          text: 'Lenses:',
          href: `/lenses/${item.fileId}`,
          key: `lenses-${item.fileId}`,
          info: (
            <SpaceBetween direction="horizontal" size="xxxs">
              {(item.usedLenses || []).map(lens => (
                <Badge 
                  key={lens.lensAlias} 
                  color={getBadgeColor(item.analysisStatus?.[lens.lensAlias])}
                >
                  {lens.lensAlias}
                </Badge>
              ))}
            </SpaceBetween>
          )
        },
        // Load results - prioritize wellarchitected lens or first lens alphabetically
        {
          type: 'link' as const,
          text: 'Load results:',
          href: `/load/${item.fileId}`,
          key: `load-${item.fileId}`,
          info: (
            <Button
              iconName="refresh"
              onClick={async (e: any) => {
                e.preventDefault();
                e.stopPropagation();
                setLoadingFileId(item.fileId);
                
                try {
                  // Prioritize 'wellarchitected' lens if available
                  const wellArchitectedLens = item.usedLenses?.find(lens => lens.lensAlias === 'wellarchitected');
                  
                  // Or use first lens alphabetically
                  const sortedLenses = [...(item.usedLenses || [])].sort((a, b) => 
                    a.lensAlias.localeCompare(b.lensAlias)
                  );
                  
                  // Select the lens to load
                  const lensToLoad = wellArchitectedLens || (sortedLenses.length > 0 ? sortedLenses[0] : undefined);
                  
                  if (lensToLoad) {
                    await onItemSelect(
                      item, 
                      true, 
                      lensToLoad.lensAliasArn,
                      lensToLoad.lensName
                    );
                  } else {
                    await onItemSelect(item, true);
                  }
                } finally {
                  setLoadingFileId(null);
                }
              }}
              ariaLabel="Load results"
              variant="inline-icon"
              loading={loadingFileId === item.fileId}
            >
              Load
            </Button>
          )
        },
        // Original file download
        {
          type: 'link' as const,
          text: 'Download original file:',
          href: `/download/${item.fileId}`,
          key: `download-${item.fileId}`,
          info: (
            <Button
              iconName="download"
              ariaLabel="Download original file"
              variant="inline-icon"
              loading={downloadingFileId === item.fileId}
              onClick={(e: any) => handleDownload(item, e)}
            />
          )
        },
        // Chat history
        {
          type: 'link' as const,
          text: 'Chat history:',
          href: `/chat-history/${item.fileId}`,
          key: `chat-history-${item.fileId}`,
          info: (
            <SpaceBetween direction="horizontal" size="xxxs">
              <Button
                iconName="download"
                ariaLabel="Download chat history"
                variant="inline-icon"
                loading={downloadingChatHistoryId === item.fileId}
                disabled={!hasChatHistory(item)}
                onClick={(e: any) => handleDownloadChatHistory(item, e)}
              >
                Download
              </Button>
              <Button
                iconName="remove"
                ariaLabel="Delete chat history"
                variant="inline-icon"
                loading={deletingChatHistoryId === item.fileId}
                disabled={!hasChatHistory(item)}
                onClick={(e: any) => handleDeleteChatHistory(item, e)}
              >
                Delete
              </Button>
            </SpaceBetween>
          )
        },
        // Delete work item
        {
          type: 'link' as const,
          text: 'Delete work item:',
          href: `/delete/${item.fileId}`,
          key: `delete-${item.fileId}`,
          info: (
            <Button
              iconName="remove"
              onClick={(e: any) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(item);
              }}
              ariaLabel="Delete results"
              variant="inline-icon"
              loading={deletingFileId === item.fileId}
            >
              Delete
            </Button>
          )
        }
      ];
      
      return {
        type: 'section' as const,
        text: `[${formatDateTime(item.lastModified)}] ${item.fileName}`,
        defaultExpanded: activeFileId === item.fileId,
        key: `section-${item.fileId}`,
        items: fileItems
      };
    }),
    { type: "divider" as const },
  ];

  const handleFollow = (event: CustomEvent<SideNavigationProps.FollowDetail>) => {
    event.preventDefault();
    
    // Parse fileId from the href
    const parts = event.detail.href.split('/');
    const action = parts[1];
    const fileId = parts.length > 2 ? parts[2] : null;
    
    const selectedItem = items.find(item => item.fileId === fileId);
    
    if (selectedItem) {
      if (action === 'lenses') {
        // Just expand the section without loading results
        onItemSelect(selectedItem, false);
      } else if (action === 'load') {
        // Handled by the button click
      } else {
        // For other actions, just expand the section
        onItemSelect(selectedItem, false);
      }
    }
  };

  if (!authState.isAuthenticated) {
    return null;
  }

  return (
    <>
      <SideNavigation
        header={{
          text: 'My Work Items',
          href: '#'
        }}
        items={navigationItems}
        onFollow={handleFollow}
        itemsControl={<Button
          key='reload-button'
          iconName="refresh"
          ariaLabel="Reload Work Items"
          loading={isReloading}
          onClick={(e: any) => {
            e.preventDefault();
            e.stopPropagation();
            loadWorkItems();
          }}
        >
          Reload Work Items
        </Button>}
      />

      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header="Delete Work Item"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                key="cancel-button"
                onClick={() => setDeleteModalVisible(false)}
                variant="link"
                disabled={deletingFileId !== null}
              >
                Cancel
              </Button>
              <Button
                key="delete-button"
                onClick={confirmDelete}
                variant="primary"
                loading={deletingFileId !== null}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box key="delete-message" variant="p">
            Are you sure you want to delete the work item "{itemToDelete?.fileName}"?
            This action cannot be undone.
          </Box>
          {itemToDelete && (
            <SpaceBetween key="status-indicators" size="xs">
              {itemToDelete.usedLenses && itemToDelete.usedLenses.map(lens => (
                <StatusIndicator 
                  key={`analysis-status-${lens.lensAlias}`} 
                  type={itemToDelete.analysisPartialResults?.[lens.lensAlias] ? "warning" : "info"}>
                  {lens.lensName} Analysis Status: {itemToDelete.analysisStatus?.[lens.lensAlias] || 'NOT_STARTED'}
                  {itemToDelete.analysisPartialResults?.[lens.lensAlias] ? " (Partial Results)" : ""}
                </StatusIndicator>
              ))}
            </SpaceBetween>
          )}
        </SpaceBetween>
      </Modal>

      <Modal
        visible={deleteChatModalVisible}
        onDismiss={() => setDeleteChatModalVisible(false)}
        header="Delete Chat History"
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                key="cancel-button"
                onClick={() => setDeleteChatModalVisible(false)}
                variant="link"
                disabled={deletingChatHistoryId !== null}
              >
                Cancel
              </Button>
              <Button
                key="delete-button"
                onClick={confirmChatDelete}
                variant="primary"
                loading={deletingChatHistoryId !== null}
              >
                Delete
              </Button>
            </SpaceBetween>
          </Box>
        }
      >
        <SpaceBetween size="m">
          <Box key="delete-message" variant="p">
            Are you sure you want to delete the chat history for "{chatToDelete?.fileName}"?
            This action cannot be undone.
          </Box>
        </SpaceBetween>
      </Modal>
    </>
  );
});

WorkSideNavigation.displayName = 'WorkSideNavigation';