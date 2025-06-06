import React, { useState, useEffect, useCallback } from 'react';
import { DocumentView } from './DocumentView';
import { SpaceBetween, Container, Button, StatusIndicator, ProgressBar, Tabs, Alert, ExpandableSection, KeyValuePairs, Badge, Select, Popover, SelectProps } from '@cloudscape-design/components';
import { FileUpload } from './FileUpload';
import { SupportingDocumentUpload } from './SupportingDocumentUpload';
import { WorkloadIdInput } from './WorkloadIdInput';
import { PillarSelector } from './PillarSelector';
import { AnalysisResults } from './AnalysisResults';
import { RiskSummary } from './RiskSummary';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { UploadedFile, UploadedFiles, WellArchitectedPillar, IaCTemplateType, UpdatedDocument, WorkItem, WorkItemContent, FileUploadMode, LensMetadata } from '../types';
import { analyzerApi } from '../services/api';
import { storageApi } from '../services/storage';
import { socketService } from '../services/socket';
import { IaCTemplateSelector } from './IaCTemplateSelector';
import { Chat } from './chat';
import { LensSelector } from './LensSelector';
import { useLanguage } from '../contexts/LanguageContext';

const DEFAULT_PILLARS: WellArchitectedPillar[] = [
  { id: 'operational-excellence', name: 'Operational Excellence', selected: true },
  { id: 'security', name: 'Security', selected: true },
  { id: 'reliability', name: 'Reliability', selected: true },
  { id: 'performance-efficiency', name: 'Performance Efficiency', selected: true },
  { id: 'cost-optimization', name: 'Cost Optimization', selected: true },
  { id: 'sustainability', name: 'Sustainability', selected: true },
];

interface ImplementationProgress {
  status: string;
  progress: number;
}

interface Props {
  onWorkItemsRefreshNeeded?: () => void;
  onAnalysisStart?: (lensAliasArn: string, lensName: string) => void;
  onCurrentLensResultsSelection?: (lensAliasArn?: string, lensName?: string) => void;
}

export const WellArchitectedAnalyzer: React.FC<Props> = ({ onWorkItemsRefreshNeeded, onAnalysisStart, onCurrentLensResultsSelection }) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFiles | null>(null);
  const [updatedDocument, setUpdatedDocument] = useState<UpdatedDocument | null>(null);
  const [workloadId, setWorkloadId] = useState<string | undefined>(undefined);
  const [activeTabId, setActiveTabId] = useState('analysis');
  const [selectedPillars, setSelectedPillars] = useState(
    DEFAULT_PILLARS.filter(p => p.selected).map(p => p.id)
  );

  const [supportingDocument, setSupportingDocument] = useState<UploadedFile | null>(null);
  const [supportingDocumentId, setSupportingDocumentId] = useState<string | null>(null);
  const [supportingDocumentDescription, setSupportingDocumentDescription] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<SelectProps.Option>(() => {
    // Load language preference from localStorage or default to English
    const savedLanguage = localStorage.getItem('preferredLanguage') || 'en';
    return { value: savedLanguage, label: savedLanguage === 'en' ? 'English' : '日本語' };
  });

  const [isDownloading, setIsDownloading] = useState(false);
  const [isImplementing, setIsImplementing] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [implementationProgress, setImplementationProgress] = useState<ImplementationProgress | null>(null);
  const [selectedIaCType, setSelectedIaCType] = useState<IaCTemplateType>(
    IaCTemplateType.CLOUDFORMATION_YAML
  );
  const [isImageFile, setIsImageFile] = useState(false);
  const [showCancellationAlert, setShowCancellationAlert] = useState(false);
  const [documentViewTabTitle, setDocumentViewTabTitle] = useState('IaC Document');
  const [showGenerationErrorWarning, setShowGenerationErrorWarning] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [activeWorkItem, setActiveWorkItem] = useState<WorkItem | null>(null);
  const [currentWorkItemName, setCurrentWorkItemName] = useState<string>('');
  const [showTokenLimitWarning, setShowTokenLimitWarning] = useState(false);
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [downloadingOriginalFileId, setDownloadingOriginalFileId] = useState<string | null>(null);
  const [downloadingSupportingDocId, setDownloadingSupportingDocId] = useState<string | null>(null);
  const [isSupportingDocUploading, setIsSupportingDocUploading] = useState<boolean>(false);
  const [selectedLens, setSelectedLens] = useState<LensMetadata | undefined>();
  const [pillarsFromLens, setPillarsFromLens] = useState<WellArchitectedPillar[]>(DEFAULT_PILLARS);
  const [optionalSettingsTabId, setOptionalSettingsTabId] = useState('lens-selector');
  const [activeLensAlias, setActiveLensAlias] = useState<string | undefined>('wellarchitected');
  const [activeLensAliasArn, setActiveLensAliasArn] = useState<string | undefined>('arn:aws:wellarchitected::aws:lens/wellarchitected');
  const [activeLensName, setActiveLensName] = useState<string>('Well-Architected Framework');
  const [currentWorkloadId, setCurrentWorkloadId] = useState<string | undefined>(undefined);
  const [currentWorkloadProtected, setCurrentWorkloadProtected] = useState<boolean | undefined>(undefined);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isNetworkInterruption, setIsNetworkInterruption] = useState(false);
  const [isLoadingNetworkResultsButton, setIsLoadingNetworkResultsButton] = useState(false);

  const {
    analyze,
    cancelAnalysis,
    isCancellingAnalysis,
    updateWorkload,
    generateReport,
    downloadRecommendations,
    refreshSummary,
    deleteWorkload,
    setError,
    analysisResults,
    riskSummary,
    setRiskSummary,
    isAnalyzing,
    isUpdating,
    error,
    progress,
    isRefreshing,
    isGeneratingReport,
    isDeleting,
    canDeleteWorkload,
    setCanDeleteWorkload,
    createdWorkloadId,
    setCreatedWorkloadId,
    showAnalysisCancellationAlert,
    setShowAnalysisCancellationAlert,
    showPartialResultsWarning,
    setShowPartialResultsWarning,
    partialResultsError,
    setAnalysisResults,
    setPartialResultsError,
    currentLensWorkloadId,
    setCurrentLensWorkloadId,
    setProgressTracking,
    progressTracking,
    awsRegion,
  } = useAnalyzer();

  // Check if analysis is complete and results are available
  const { strings } = useLanguage();
  const isAnalysisComplete = Boolean(analysisResults && analysisResults.length > 0);

  useEffect(() => {
    const cleanup = socketService.onImplementationProgress((progressData: ImplementationProgress) => {
      setImplementationProgress(progressData);
    });

    return () => {
      cleanup();
    };
  }, []);

  // Handle lens selection
  const handleLensChange = (lensAliasArn: string, lensMetadata: LensMetadata) => {
    setSelectedLens(lensMetadata);

    const lensAlias = lensAliasArn?.split('/')?.pop();

    setActiveLensAlias(lensAlias);
    setActiveLensAliasArn(lensAliasArn);
    setActiveLensName(lensMetadata?.lensName);

    setSupportingDocumentId(null);
    setSupportingDocument(null);
    setSupportingDocumentDescription('');

    // Switch to analysis tab
    setActiveTabId('analysis');

    // Update pillars based on the lens
    if (lensMetadata && lensMetadata.lensPillars) {
      const newPillars = Object.entries(lensMetadata.lensPillars).map(([pillarId, pillarName]) => ({
        id: pillarId,
        name: pillarName,
        selected: true,
        pillarId // Store the original ID
      }));
      setPillarsFromLens(newPillars);

      // Reset selected pillars when lens changes
      setSelectedPillars(newPillars.map(p => p.id));
    }
  };

  const handleLoadNetworkInterruptionResults = async () => {
    if (!activeWorkItem) return;
    
    setIsLoadingNetworkResultsButton(true);
    try {
      await handleWorkItemSelect(activeWorkItem, true, activeLensAliasArn);
    } finally {
      setIsLoadingNetworkResultsButton(false);
    }
  };

  // Handle supporting document upload
  const handleSupportingDocumentUploaded = (file: UploadedFile, description: string, fileId: string) => {
    setSupportingDocument(file);
    setSupportingDocumentId(fileId);
    setSupportingDocumentDescription(description);

    // If we already have an uploaded file, update the uploadedFiles object
    if (uploadedFiles) {
      setUploadedFiles({
        ...uploadedFiles,
        supportingDocument: file,
        supportingDocumentId: fileId,
        supportingDocumentDescription: description
      });
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedFiles || !activeWorkItem) return;

    // Reset risk summary when starting a new analysis
    setRiskSummary(null);
    setProgressTracking(null);
    setIsNetworkInterruption(false);

    // Switch to analysis tab
    setActiveTabId('analysis');

    try {
      // Refresh side navigation when analysis starts
      onWorkItemsRefreshNeeded?.();

      // Use the currently selected lens alias and name
      const currentLensAliasArn = activeLensAliasArn || 'arn:aws:wellarchitected::aws:lens/wellarchitected';
      const currentLensAlias = activeLensAlias || 'wellarchitected';
      const currentLensName = activeLensName || 'Well-Architected Framework';

      // Notify the parent App component about the lens information
      if (onAnalysisStart) {
        onAnalysisStart(currentLensAliasArn, currentLensName);
      }

      setCurrentWorkItemName(`${activeWorkItem.fileName}`);

      const result = await analyze(
        activeWorkItem.fileId,
        workloadId || currentWorkloadId || currentLensWorkloadId,
        selectedPillars,
        uploadedFiles.mode,
        supportingDocumentId,
        supportingDocumentDescription,
        currentLensAliasArn,
        currentLensName,
        selectedLens?.lensPillars,
        undefined, // isTempWorkload
        selectedLanguage.value || 'en' // Add language parameter with default
      );

      // Check if the result indicates a network interruption
      if (result.isNetworkInterruption) {
        setIsNetworkInterruption(true);
      }

      // Update activeWorkItem with fileId from analysis result, even for partial results
      if (result.fileId && activeWorkItem) {
        // If we have an existing activeWorkItem, update it
        setActiveWorkItem({
          ...activeWorkItem,
          fileId: result.fileId,
          // Initialize or update usedLenses array
          usedLenses: [
            ...(activeWorkItem.usedLenses || []),
            {
              lensAlias: currentLensAlias,
              lensName: currentLensName,
              lensAliasArn: currentLensAliasArn
            }
          ].filter((lens, index, self) =>
            // Remove duplicates based on lensAlias
            index === self.findIndex(t => t.lensAlias === lens.lensAlias)
          ),
          // Initialize or update lens-specific fields 
          supportingDocumentId: {
            ...(activeWorkItem.supportingDocumentId || {}),
            [currentLensAlias]: supportingDocumentId || undefined
          },
          supportingDocumentAdded: {
            ...(activeWorkItem.supportingDocumentAdded || {}),
            [currentLensAlias]: Boolean(supportingDocumentId)
          },
          supportingDocumentDescription: {
            ...(activeWorkItem.supportingDocumentDescription || {}),
            [currentLensAlias]: supportingDocumentDescription || undefined
          },
          supportingDocumentName: {
            ...(activeWorkItem.supportingDocumentName || {}),
            [currentLensAlias]: supportingDocument?.name
          },
          supportingDocumentType: {
            ...(activeWorkItem.supportingDocumentType || {}),
            [currentLensAlias]: supportingDocument?.type
          },
        });

        // Clear IaC Document tab content if no IaC generation attempted for activeWorkItem
        const lensIacStatus = activeWorkItem.iacGenerationStatus?.[currentLensAlias];
        if (!isImageFile || lensIacStatus === 'NOT_STARTED' || lensIacStatus === 'FAILED' || !lensIacStatus) {
          setUpdatedDocument(null);
          // If currently on the IaC Document tab, switch to analysis tab
          if (activeTabId === 'diff') {
            setActiveTabId('analysis');
          }
        }
      } else if (result.fileId) {
        // If we don't have an activeWorkItem but have a fileId, create a new minimal WorkItem
        setActiveWorkItem({
          userId: '', // This will be set by the backend
          fileId: result.fileId,
          fileName: uploadedFiles.singleFile?.name ||
            uploadedFiles.zipFile?.name ||
            'Multiple files',
          fileType: uploadedFiles.singleFile?.type ||
            uploadedFiles.zipFile?.type ||
            'application/multiple-files',
          uploadDate: new Date().toISOString(),
          s3Prefix: `${result.fileId}`,
          lastModified: new Date().toISOString(),
          uploadMode: uploadedFiles.mode,
          usedLenses: [{
            lensAlias: currentLensAlias,
            lensName: currentLensName,
            lensAliasArn: currentLensAliasArn
          }],
          // Initialize lens-specific maps with the current lens
          analysisStatus: { [currentLensAlias]: 'IN_PROGRESS' },
          analysisProgress: { [currentLensAlias]: 0 },
          iacGenerationStatus: { [currentLensAlias]: 'NOT_STARTED' },
          iacGenerationProgress: { [currentLensAlias]: 0 },
          supportingDocumentId: supportingDocumentId ? {
            [currentLensAlias]: supportingDocumentId
          } : undefined,
          supportingDocumentAdded: supportingDocumentId ? {
            [currentLensAlias]: true
          } : undefined,
          supportingDocumentDescription: supportingDocumentDescription ? {
            [currentLensAlias]: supportingDocumentDescription
          } : undefined,
          supportingDocumentName: supportingDocument?.name ? {
            [currentLensAlias]: supportingDocument.name
          } : undefined,
          supportingDocumentType: supportingDocument?.type ? {
            [currentLensAlias]: supportingDocument.type
          } : undefined,
        });
        setCurrentWorkItemName(`${uploadedFiles.singleFile?.name || uploadedFiles.zipFile?.name || 'Multiple files'}`);
        if (!isImageFile) {
          setUpdatedDocument(null);
        }
      }
    } catch (err) {
      // Handle any errors that might occur during analysis
      console.error("Analysis failed:", err);
      setError(err instanceof Error ? err.message : 'Analysis failed unexpectedly. Please try again.');
    } finally {
      // Always refresh side navigation when analysis completes or fails
      onWorkItemsRefreshNeeded?.();

      // Get the complete work item from backend
      const loadedWorkItem = await storageApi.getWorkItem(activeWorkItem.fileId, activeLensAliasArn);

      // Only proceed if we got results
      if (!loadedWorkItem) {
        setError('Failed to load work item');
        return;
      }

      // Set complete workItem loaded from backend
      setActiveWorkItem(loadedWorkItem.workItem);
    }
  };

  const handleUpdate = async (activeWorkItem?: any, specificWorkloadId?: string, specificLensAliasArn?: string, currentWorkloadProtected?: boolean) => {
    // Use provided values or the current state values
    const activeWorkloadId = specificWorkloadId || workloadId || createdWorkloadId;
    const activeLensArn = specificLensAliasArn || activeLensAliasArn;

    const isWorkloadProtected = workloadId ? true : currentWorkloadProtected;

    await updateWorkload(activeWorkloadId, activeLensArn, activeWorkItem, isWorkloadProtected);

    // Get the complete work item from backend
    const loadedWorkItem = await storageApi.getWorkItem(activeWorkItem.fileId, activeLensArn);

    // Only proceed if we got results
    if (!loadedWorkItem) {
      setError('Failed to load work item');
      return;
    }

    // Set complete workItem loaded from backend
    setActiveWorkItem(loadedWorkItem.workItem);
  };

  const handleDeleteWorkload = async (activeWorkItem?: any, activeLensAlias?: string, activeLensArn?: string) => {

    await deleteWorkload(activeWorkItem, activeLensAlias);

    // Get the complete work item from backend
    const loadedWorkItem = await storageApi.getWorkItem(activeWorkItem.fileId, activeLensArn);

    // Only proceed if we got results
    if (!loadedWorkItem) {
      setError('Failed to load work item');
      return;
    }

    // Set complete workItem loaded from backend
    setActiveWorkItem(loadedWorkItem.workItem);
  };

  const handleFileUploaded = (files: UploadedFiles, fileId: string) => {
    setUploadedFiles({
      ...files,
      supportingDocument: supportingDocument || undefined,
      supportingDocumentId: supportingDocumentId || undefined,
      supportingDocumentDescription: supportingDocumentDescription || undefined
    });

    // Set isImageFile based on file type
    if (files.mode === FileUploadMode.SINGLE_FILE && files.singleFile) {
      const isImage = files.singleFile.type.startsWith('image/');
      setIsImageFile(isImage);
    } else {
      // Not an image for ZIP or multiple files
      setIsImageFile(false);
    }

    // Reset current workload ID, active workItem and other states to defaults for new file uploaded
    setActiveWorkItem(null);
    setCurrentWorkloadId(undefined);
    setCurrentLensWorkloadId(undefined);
    setCanDeleteWorkload(false);
    setRiskSummary(null);
    setSupportingDocumentId(null);
    setSupportingDocument(null);
    setSupportingDocumentDescription('');

    // Check if we need to show token limit warning
    if (files.exceedsTokenLimit) {
      setShowTokenLimitWarning(true);
      setTokenCount(files.tokenCount || 0);
    } else {
      setShowTokenLimitWarning(false);
      setTokenCount(null);
    }

    // Store the fileId for later use
    let fileName = '';
    let fileType = '';
    if (files.singleFile) {
      if (files.singleFile.type == 'application/pdf') {
        fileName = `${files.singleFile.name}.zip`;
        fileType = files.singleFile.type;
      } else {
        fileName = files.singleFile.name;
        fileType = files.singleFile.type;
      }
    } else if (files.zipFile) {
      fileName = files.zipFile.name;
      fileType = files.zipFile.type;
    } else if (files.multipleFiles && files.multipleFiles.length > 0) {
      fileName = files.multipleFiles.length < 2
        ? files.multipleFiles.map(f => f.name).join('_')
        : `${files.multipleFiles[0].name}_and_${files.multipleFiles.length - 1}_more_files.zip`;
      fileType = 'application/multiple-files';
    }

    setActiveWorkItem({
      userId: '', // This will be set by the backend
      fileId: fileId,
      fileName: fileName,
      fileType: fileType,
      uploadDate: new Date().toISOString(),
      s3Prefix: `${fileId}`,
      lastModified: new Date().toISOString(),
      uploadMode: files.mode,
    });
  };

  const handleDownloadSupportingDocument = async (supportingDocId: string, fileName: string) => {
    try {
      if (!activeWorkItem?.fileId) {
        setError('Cannot download supporting document: no active work item');
        return;
      }

      setDownloadingSupportingDocId(supportingDocId);

      // Pass the lens alias when downloading supporting document
      await storageApi.downloadSupportingDocument(
        supportingDocId,
        activeWorkItem.fileId,
        fileName,
        activeLensAlias
      );
    } catch (error) {
      console.error("Failed to download supporting document:", error);
      setError(error instanceof Error ? error.message : 'Failed to download supporting document');
    } finally {
      setDownloadingSupportingDocId(null);
    }
  };

  const handleGenerateReport = async (specificWorkloadId?: string, specificLensAliasArn?: string) => {
    // Use provided values or the current state values
    const activeWorkloadId = specificWorkloadId || workloadId || createdWorkloadId || currentWorkloadId;
    const activeLensArn = specificLensAliasArn || activeLensAliasArn;
    if (!activeWorkloadId) return;
    await generateReport(activeWorkloadId, uploadedFiles?.singleFile?.name || 'unknown_file', activeLensArn);
  };

  const handleRefresh = async (specificWorkloadId?: string, specificLensAliasArn?: string) => {
    // Use provided values or the current state values
    const activeWorkloadId = specificWorkloadId || workloadId || createdWorkloadId || currentWorkloadId;
    const activeLensArn = specificLensAliasArn || activeLensAliasArn;

    if (!activeWorkloadId) {
      // If no workload ID available or no previous update in the workload for this lens has been done in the past, reset the risk summary
      setRiskSummary(null);
      return;
    }

    // Make sure we're passing a string ID and not an object
    let workloadIdToUse = activeWorkloadId;

    // Handle case when workloadId might be an object with an id property
    if (typeof activeWorkloadId === 'object' && activeWorkloadId !== null) {
      workloadIdToUse = (activeWorkloadId as any).id || '';
    }

    // Call the refresh function with the workload ID and lens alias
    if (typeof workloadIdToUse === 'string') {
      refreshSummary(workloadIdToUse, activeLensArn);
    } else {
      setError('Invalid workload ID format');
    }
  };

  const handleGenerateIacDocument = async () => {
    if (!uploadedFiles?.singleFile || !analysisResults || !activeWorkItem) return;

    try {
      // Refresh side navigation when IaC generation starts
      onWorkItemsRefreshNeeded?.();

      setIsImplementing(true);
      setShowGenerationErrorWarning(false);
      setGenerationError(null);

      const result = await analyzerApi.generateIacDocument(
        activeWorkItem.fileId,
        analysisResults,
        selectedIaCType,
        activeLensAliasArn,
        selectedLens?.lensName
      );

      // Refresh side navigation when IaC generation completes (success, failure, or cancelled)
      onWorkItemsRefreshNeeded?.();

      if (result.error) {
        onWorkItemsRefreshNeeded?.();
        setShowGenerationErrorWarning(true);
        setGenerationError(result.error);
      }

      if (result.content) {
        setUpdatedDocument({
          content: result.content,
          name: uploadedFiles.singleFile.name,
          templateType: selectedIaCType
        });
        setDocumentViewTabTitle('IaC Document (Updated)');

        if (result.isCancelled) {
          setShowCancellationAlert(true);
        }
      }
    } catch (error) {
      setShowGenerationErrorWarning(true);
      setGenerationError('An unexpected error occurred during generation.');
    } finally {
      setIsImplementing(false);
      setImplementationProgress(null);
    }
  };

  const handleDownloadRecommendations = async () => {
    try {
      setIsDownloading(true);
      await downloadRecommendations(
        uploadedFiles?.singleFile?.name ||
        uploadedFiles?.zipFile?.name ||
        'analysis_results', activeLensAlias
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleOriginalFileDownload = async (fileId: string, fileName: string) => {
    setDownloadingOriginalFileId(fileId);
    try {
      await storageApi.downloadOriginalContent(fileId, fileName);
    } catch (error) {
      console.error('Failed to download file:', error);
    } finally {
      setDownloadingOriginalFileId(null);
    }
  };

  const acceptedFileTypes = [
    '.yaml', '.yml', '.json', '.tf',  // IaC files
    '.png', '.jpg', '.jpeg', '.zip',   // Image and zip files
    '.ts', '.py', '.go', '.java', '.cs'   // CDK supported programming languages files
  ];

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

  const handleWorkItemSelect = useCallback(async (workItem: WorkItem, loadResults?: boolean, lensAliasArn?: string) => {
    try {
      // Set loading state if we're loading results
      if (loadResults) {
        setIsLoadingResults(true);
      }

      setProgressTracking(null);
      setActiveWorkItem(workItem);

      const lensAlias = lensAliasArn?.split('/')?.pop();
      let lensName = '';

      // Reset risk summary when switching work items
      setRiskSummary(null);
      setCreatedWorkloadId(undefined);
      setWorkloadId(undefined);

      // If lensAlias is provided, set it as active
      if (lensAlias) {
        setActiveLensAlias(lensAlias);
        setActiveLensAliasArn(lensAliasArn);
      
        // Find the lens in workItem.usedLenses to get the lens name
        const lens = workItem.usedLenses?.find(l => l.lensAlias === lensAlias);
        if (lens) {
          setActiveLensName(lens.lensName);
          lensName = lens.lensName;
        }

        // Check if there's a workloadId for this lens
        if (workItem.workloadIds && workItem.workloadIds[lensAlias]) {
          setCurrentWorkloadId(workItem.workloadIds[lensAlias].id);
          setCurrentWorkloadProtected(workItem.workloadIds[lensAlias].protected);
          setCurrentLensWorkloadId(workItem.workloadIds[lensAlias].id);
          setCanDeleteWorkload(!workItem.workloadIds[lensAlias].protected);

          // After setting the current workload ID, refresh the summary
          if (loadResults) {
            setTimeout(() => {
              const workloadId = workItem.workloadIds?.[lensAlias]?.id;
              if (workloadId) {
                handleRefresh(workloadId, lensAliasArn);
              }
            }, 100);
          }
        } else if (workItem.workloadIds && Object.keys(workItem.workloadIds).length > 0) {
          // Else if - The workload in the WS Tool has never being updated for this particular lens
          // Use the first entry in workloadIds map for workload info, regardless of which lens is active
          const firstLensAlias = Object.keys(workItem.workloadIds)[0];
          const workloadInfo = workItem.workloadIds[firstLensAlias];
          
          setCurrentWorkloadId(workloadInfo.id);
          setCurrentWorkloadProtected(workloadInfo.protected);
          setCurrentLensWorkloadId(workloadInfo.id);
          setCanDeleteWorkload(!workloadInfo.protected);
        } else {
          // No workloadIds for current work item. Reset currentWorkloadId and currentLensWorkloadId
          setCurrentWorkloadId(undefined);
          setCreatedWorkloadId(undefined);
          setCurrentLensWorkloadId(undefined);
          setCanDeleteWorkload(false);
        }
      }

      const currentLensAlias = lensAlias ||
        (workItem.usedLenses && workItem.usedLenses.length > 0 ?
          workItem.usedLenses[0].lensAlias :
          'wellarchitected');

      setCurrentWorkItemName(`[${formatDateTime(workItem.lastModified)}] ${workItem.fileName}`);

      // Get the complete work item with all results
      const result = await storageApi.getWorkItem(workItem.fileId, lensAliasArn);

      // Only proceed if we got results
      if (!result) {
        setError('Failed to load work item results');
        return;
      }

      // Set workItem loaded from backend
      const loadedWorkItem = result.workItem;

      // Notify the parent App component about the lens information
      if (onCurrentLensResultsSelection) {
        onCurrentLensResultsSelection(lensAliasArn, lensName);
      }

      // Set image file flag
      if (loadedWorkItem.uploadMode === FileUploadMode.SINGLE_FILE && loadedWorkItem.fileType?.startsWith('image/')) {
        setIsImageFile(true);
      } else {
        setIsImageFile(false);
      }

      // Show token warning if applicable - check the token count for the current lens
      const lensTokenCount = loadedWorkItem.tokenCount;
      const lensExceedsTokenLimit = loadedWorkItem.exceedsTokenLimit;

      if (lensExceedsTokenLimit) {
        setShowTokenLimitWarning(true);
        setTokenCount(lensTokenCount || 0);
      } else {
        setShowTokenLimitWarning(false);
        setTokenCount(null);
      }

      // Check if IaC generation is started for this lens
      const lensIacStatus = loadedWorkItem.iacGenerationStatus?.[currentLensAlias];
      if (lensIacStatus === 'NOT_STARTED' || lensIacStatus === 'FAILED' || !lensIacStatus) {
        setUpdatedDocument(null);
        // If currently on the IaC Document tab, switch to analysis tab
        if (activeTabId === 'diff') {
          setActiveTabId('analysis');
        }
      }

      // Check if there's a supporting document for this lens
      if (loadedWorkItem.supportingDocumentAdded?.[currentLensAlias] && loadedWorkItem.supportingDocumentId?.[currentLensAlias]) {
        setSupportingDocumentId(loadedWorkItem.supportingDocumentId[currentLensAlias]);
        setSupportingDocumentDescription(loadedWorkItem.supportingDocumentDescription?.[currentLensAlias] || '');
        if (loadedWorkItem.supportingDocumentName?.[currentLensAlias] && loadedWorkItem.supportingDocumentType?.[currentLensAlias]) {
          setSupportingDocument({
            name: loadedWorkItem.supportingDocumentName[currentLensAlias],
            content: '', // Not loaded, would be loaded on demand
            type: loadedWorkItem.supportingDocumentType[currentLensAlias],
            size: 0 // Size unknown, not critical for display
          });
        }
      } else {
        // Reset supporting document state if none exists
        setSupportingDocument(null);
        setSupportingDocumentId(null);
        setSupportingDocumentDescription('');
      }

      // Create appropriate uploadedFiles object based on loadedWorkItem.uploadMode
      if (result.content) {
        let fileContent: string;

        // Handle different content types
        if (typeof result.content === 'string') {
          fileContent = result.content;
        } else {
          const contentObj = result.content as WorkItemContent;
          if (loadedWorkItem.uploadMode === FileUploadMode.SINGLE_FILE && loadedWorkItem.fileType.startsWith('image/')) {
            // For images, ensure proper base64 format
            fileContent = contentObj.data.startsWith('data:')
              ? contentObj.data
              : `data:${loadedWorkItem.fileType};base64,${contentObj.data}`;
          } else {
            // For text content
            fileContent = contentObj.data;
          }
        }

        let files: UploadedFiles = {
          mode: loadedWorkItem.uploadMode || FileUploadMode.SINGLE_FILE,
        };

        if (loadedWorkItem.uploadMode === FileUploadMode.SINGLE_FILE) {
          files.singleFile = {
            name: loadedWorkItem.fileName,
            content: fileContent,
            type: loadedWorkItem.fileType,
            size: new Blob([fileContent]).size,
          };
        } else if (loadedWorkItem.uploadMode === FileUploadMode.ZIP_FILE) {
          files.zipFile = {
            name: loadedWorkItem.fileName,
            content: fileContent,
            type: loadedWorkItem.fileType,
            size: new Blob([fileContent]).size,
          };
          // For work item token counts
          files.exceedsTokenLimit = loadedWorkItem.exceedsTokenLimit;
          files.tokenCount = loadedWorkItem.tokenCount;
        } else {
          files.multipleFiles = [{
            name: loadedWorkItem.fileName,
            content: fileContent,
            type: loadedWorkItem.fileType,
            size: new Blob([fileContent]).size,
          }];
          // For work item token counts
          files.exceedsTokenLimit = loadedWorkItem.exceedsTokenLimit;
          files.tokenCount = loadedWorkItem.tokenCount;
        }

        setUploadedFiles(files);
      }

      // Load analysis results if completed for this lens
      if ((loadedWorkItem.analysisStatus?.[currentLensAlias] === 'COMPLETED' ||
        loadedWorkItem.analysisStatus?.[currentLensAlias] === 'PARTIAL') &&
        result.analysisResults) {
        setAnalysisResults(result.analysisResults);
        setActiveTabId('analysis');
      }

      // Load IaC document if completed for this lens
      if ((loadedWorkItem.iacGenerationStatus?.[currentLensAlias] === 'COMPLETED' ||
        loadedWorkItem.iacGenerationStatus?.[currentLensAlias] === 'PARTIAL') &&
        result.iacDocument) {
        setUpdatedDocument({
          content: result.iacDocument,
          name: loadedWorkItem.fileName,
          templateType: selectedIaCType,
        });
        if (!result.analysisResults) {
          setActiveTabId('diff');
        }
      }

      // Show any errors if either process failed for this lens
      if (loadedWorkItem.analysisError?.[currentLensAlias] || loadedWorkItem.iacGenerationError?.[currentLensAlias]) {
        setShowPartialResultsWarning(true);
        setPartialResultsError(
          `Previous errors encountered: ${[
            loadedWorkItem.analysisError?.[currentLensAlias],
            loadedWorkItem.iacGenerationError?.[currentLensAlias],
          ]
            .filter(Boolean)
            .join(', ')}`
        );
      }

      setActiveWorkItem(loadedWorkItem);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load work item');
    } finally {
      // Reset loading state when complete
      if (loadResults) {
        setIsLoadingResults(false);
      }
    }
  }, [setActiveWorkItem, setError, setUploadedFiles, setAnalysisResults, setActiveTabId, setUpdatedDocument, selectedIaCType, setActiveLensAlias, setActiveLensAliasArn, setCanDeleteWorkload]);

  // Effect to listen for workItemSelected events
  useEffect(() => {
    const handleWorkItemSelected = async (event: Event) => {
      const customEvent = event as CustomEvent<{ workItem: WorkItem, lensAliasArn?: string }>;
      try {
        await handleWorkItemSelect(
          customEvent.detail.workItem,
          true,
          customEvent.detail.lensAliasArn
        );

        // Dispatch loadComplete event
        const element = document.querySelector('[data-testid="well-architected-analyzer"]');
        if (element) {
          element.dispatchEvent(new CustomEvent('loadComplete', { bubbles: true }));
        }
      } catch (error) {
        console.error('Error handling work item selection:', error);
        // Still dispatch loadComplete even if there's an error
        const element = document.querySelector('[data-testid="well-architected-analyzer"]');
        if (element) {
          element.dispatchEvent(new CustomEvent('loadComplete', { bubbles: true }));
        }
      }
    };

    const element = document.querySelector('[data-testid="well-architected-analyzer"]');
    if (element) {
      element.addEventListener('workItemSelected', handleWorkItemSelected);
    }

    return () => {
      if (element) {
        element.removeEventListener('workItemSelected', handleWorkItemSelected);
      }
    };
  }, [handleWorkItemSelect]);

  return (
    <SpaceBetween size="l">
      <Container key="main-upload-container">
        <SpaceBetween size="l">
          <FileUpload
            key="file-upload"
            onFileUploaded={handleFileUploaded}
            acceptedFileTypes={acceptedFileTypes}
          />

          <PillarSelector
            key="pillar-selector"
            pillars={pillarsFromLens}
            selectedPillars={selectedPillars}
            onChange={setSelectedPillars}
            disabled={isAnalyzing || isUpdating}
            selectedLens={selectedLens}
          />

          <ExpandableSection
            headerText="Optional Settings"
            variant="inline"
          >
            <Tabs
              activeTabId={optionalSettingsTabId}
              variant="container"
              onChange={({ detail }) => setOptionalSettingsTabId(detail.activeTabId)}
              tabs={[
                {
                  id: 'lens-selector',
                  label: 'Lens Selector',
                  content: (
                    <SpaceBetween direction="vertical" size="l">
                      <LensSelector
                        value={selectedLens?.lensAlias || ''}
                        onChange={handleLensChange}
                        disabled={isAnalyzing || isUpdating}
                      />
                    </SpaceBetween>
                  )
                },
                {
                  id: 'language-selector',
                  label: 'Output Language',
                  content: (
                    <Container>
                      <SpaceBetween size="l">
                        <Select
                          selectedOption={selectedLanguage}
                          onChange={({ detail }) => {
                            setSelectedLanguage(detail.selectedOption);
                            localStorage.setItem('preferredLanguage', detail.selectedOption.value || 'en');
                          }}
                          options={[
                            { value: 'en', label: 'English' },
                            { value: 'ja', label: '日本語' }
                          ]}
                          ariaLabel="Output language"
                        />
                        {selectedLanguage.value !== 'en' && (
                          <Alert type="info">
                            {strings.wellArchitectedAnalyzer.analysisLanguageNotice.replace('{language}', selectedLanguage.label || '日本語')}
                          </Alert>
                        )}
                      </SpaceBetween>
                    </Container>
                  )
                },
                {
                  id: 'supporting-document',
                  label: 'Supporting Document Upload',
                  content: (
                    <SpaceBetween direction="vertical" size="l">
                      <SupportingDocumentUpload
                        onDocumentUploaded={handleSupportingDocumentUploaded}
                        disabled={isAnalyzing || isUpdating || !uploadedFiles}
                        onUploadStatusChange={setIsSupportingDocUploading}
                        activeWorkItemId={activeWorkItem?.fileId}
                        lensAliasArn={activeLensAliasArn}
                      />
                    </SpaceBetween>
                  )
                },
                {
                  id: 'well-architected-tool',
                  label: 'Well-Architected Tool',
                  content: (
                    <SpaceBetween direction="vertical" size="l">
                      <WorkloadIdInput
                        value={workloadId || ''}
                        onChange={setWorkloadId}
                        optional={true}
                        disabled={!!createdWorkloadId}
                      />
                    </SpaceBetween>
                  )
                },
                {
                  id: 'iac-generation',
                  label: 'IaC Generation',
                  content: (
                    <SpaceBetween direction="vertical" size="l">
                      <IaCTemplateSelector
                        value={selectedIaCType}
                        onChange={setSelectedIaCType}
                        disabled={isAnalyzing || isUpdating || isLoadingDetails || isImplementing}
                      />
                      {!isImageFile && (
                        <Alert type="info">
                          IaC template generation is only available when analyzing architecture diagram images.
                        </Alert>
                      )}
                    </SpaceBetween>
                  ),
                  disabled: !isImageFile
                }
              ]}
            />
          </ExpandableSection>

          {isNetworkInterruption && (
            <Alert
              key="network-interruption-alert"
              type="info"
              dismissible
              onDismiss={() => {
                setIsNetworkInterruption(false);
                setError(null);
              }}
              header="Network Connection Interrupted"
              action={
                <SpaceBetween direction="horizontal" size="xs">
                  {activeWorkItem && (
                    <Button
                      variant="primary"
                      onClick={handleLoadNetworkInterruptionResults}
                      loading={isLoadingNetworkResultsButton}
                      disabled={isLoadingNetworkResultsButton}
                    >
                      Load Results
                    </Button>
                  )}
                </SpaceBetween>
              }
            >
              <p>Your network connection was interrupted while the analysis was running. 
              The analysis has likely completed in the background.</p>
              
              <p><strong>You can:</strong></p>
              <ul>
                <li>Click "Load Results" to try loading the most recent results</li>
                <li>Or expand your work item in the side navigation panel and click "Load results"</li>
              </ul>
            </Alert>
          )}

          {error && !isNetworkInterruption && (
            <Alert
              key="error-alert"
              type="error"
              dismissible
              onDismiss={() => setError(null)}
              header="Error"
            >
              {error}
            </Alert>
          )}

          {showTokenLimitWarning && tokenCount && (
            <Alert
              key="token-limit-alert"
              type="warning"
              dismissible
              onDismiss={() => setShowTokenLimitWarning(false)}
              header="Token Limit Warning"
            >
              Your project contains approximately {tokenCount.toLocaleString()} tokens, which exceeds the recommended limit of 200,000 tokens.
              The model invocation may fail or the analysis may lose context due to the large file size. Consider breaking your project into smaller pieces for better results.
            </Alert>
          )}

          <SpaceBetween key="action-buttons" size="xs" direction="horizontal">
            <Button
              key="analyze-button"
              variant="primary"
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={!uploadedFiles || selectedPillars.length === 0 || isSupportingDocUploading}
              iconName="gen-ai"
            >
              {strings.wellArchitectedAnalyzer.startReview}
            </Button>
            {isAnalyzing && (
              <Button
                key="cancel-button"
                onClick={cancelAnalysis}
                iconName="close"
                disabled={isCancellingAnalysis || !progress}
                loading={isCancellingAnalysis}
              >
                {isCancellingAnalysis ? strings.wellArchitectedAnalyzer.cancelling : strings.wellArchitectedAnalyzer.cancelReview}
              </Button>
            )}
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {isAnalyzing && progress && (
        <Container key="main-analysis-progress">
          <SpaceBetween size="m">
            <StatusIndicator key="analysis-progress-status" type="in-progress">
              [{progress.processedQuestions}/{progress.totalQuestions}] Analyzing uploaded file according to:
              '{progress.currentPillar} - {progress.currentQuestion}'
            </StatusIndicator>
            <ProgressBar
              key="analysis-progress-bar"
              value={Math.round((progress.processedQuestions / progress.totalQuestions) * 100)}
              description="Analysis progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {isImplementing && implementationProgress && (
        <Container key="main-implementation-progress">
          <SpaceBetween size="m">
            <StatusIndicator key="implementation-progress-status" type="in-progress">
              {implementationProgress.status}
            </StatusIndicator>
            <ProgressBar
              key="implementation-progress-bar"
              value={implementationProgress.progress}
              description="IaC document generation progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {isLoadingDetails && implementationProgress && (
        <Container key="main-loading-progress">
          <SpaceBetween size="m">
            <StatusIndicator key="loading-progress-status" type="in-progress">
              {implementationProgress.status}
            </StatusIndicator>
            <ProgressBar
              key="loading-progress-bar"
              value={implementationProgress.progress}
              description="Analysis progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {showAnalysisCancellationAlert && (
        <Alert
          key="main-analysis-cancellation-alert"
          onDismiss={() => setShowAnalysisCancellationAlert(false)}
          dismissible
          type="warning"
          header="Analysis cancelled"
        >
          The analysis of the uploaded file was cancelled. Partial results are shown below.
          You can either use these partial results or try analyzing the complete
          file again.
        </Alert>
      )}

      {showCancellationAlert && (
        <Alert
          key="main-cancellation-alert"
          onDismiss={() => setShowCancellationAlert(false)}
          dismissible
          type="warning"
          header="Generation cancelled"
        >
          The IaC document generation was cancelled. A partial version has been generated
          and can be viewed in the 'IaC Document' tab. You can either use this partial
          version or try generating the complete document again.
        </Alert>
      )}

      {showPartialResultsWarning && (
        <Alert
          key="main-partial-results-warning"
          onDismiss={() => setShowPartialResultsWarning(false)}
          dismissible
          type="warning"
          header="Partial Analysis Results"
        >
          {partialResultsError + ' ' || 'Analysis was interrupted. Showing partial results.'}
          You can either use these partial results or try
          analyzing the complete file again after waiting a few minutes.
        </Alert>
      )}

      {showGenerationErrorWarning && (
        <Alert
          key="main-generation-error-warning"
          onDismiss={() => setShowGenerationErrorWarning(false)}
          dismissible
          type="warning"
          header="Partial IaC Document Generation"
        >
          {generationError + ' ' || 'Template generation was interrupted. Showing partial results.'}
          You can try generating the complete document again after waiting a few minutes.
        </Alert>
      )}

      {currentWorkItemName && (
        <Container>
          <KeyValuePairs
            columns={4}
            items={[
              {
                label: "Current Work Item",
                value: (
                  <SpaceBetween direction="horizontal" size="xxxs" alignItems="center">
                    {currentWorkItemName}
                    {activeWorkItem && (
                      <Button
                        iconName="download"
                        ariaLabel="Download original file"
                        variant="inline-icon"
                        loading={downloadingOriginalFileId === activeWorkItem.fileId}
                        onClick={() => handleOriginalFileDownload(activeWorkItem.fileId, currentWorkItemName)}
                      />
                    )}
                  </SpaceBetween>
                )
              },
              {
                label: "Current Lens",
                value: (
                  <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                    {activeWorkItem && activeWorkItem.usedLenses && activeWorkItem.usedLenses.length > 0 ? (
                      <Select
                        selectedOption={
                          activeLensAlias ?
                            {
                              label: activeWorkItem.usedLenses.find(lens => lens.lensAlias === activeLensAlias)?.lensName || activeLensName,
                              value: activeLensAlias
                            } : null
                        }
                        onChange={({ detail }) => {
                          if (detail.selectedOption) {
                            const selectedLensAlias = detail.selectedOption.value as string;
                            const selectedLens = activeWorkItem.usedLenses?.find(lens => lens.lensAlias === selectedLensAlias);

                            if (selectedLens) {
                              setActiveLensAlias(selectedLens.lensAlias);
                              setActiveLensAliasArn(selectedLens.lensAliasArn);
                              setActiveLensName(selectedLens.lensName);

                              // Load results for the selected lens
                              handleWorkItemSelect(activeWorkItem, true, selectedLens.lensAliasArn);
                            }
                          }
                        }}
                        options={activeWorkItem.usedLenses.map(lens => ({
                          label: lens.lensName,
                          value: lens.lensAlias,
                          description: lens.lensAliasArn
                        }))}
                        filteringType="auto"
                        placeholder="Select a lens"
                        disabled={isLoadingResults}
                      />
                    ) : (
                      activeLensName
                    )}
                  </SpaceBetween>
                )
              },
              {
                label: "Current Lens Results Status",
                value: (
                  <SpaceBetween direction="horizontal" size="xs" alignItems="center">
                    {activeWorkItem && activeLensAlias && activeWorkItem.analysisProgress &&
                      activeWorkItem.analysisProgress[activeLensAlias] !== undefined ? (
                      <>
                        {activeWorkItem.analysisStatus && activeWorkItem.analysisStatus[activeLensAlias] === 'PARTIAL' ? (
                          <Badge color="blue">
                            Partial results - Stopped at {activeWorkItem.analysisProgress[activeLensAlias]}%
                          </Badge>
                        ) : activeWorkItem.analysisStatus && activeWorkItem.analysisStatus[activeLensAlias] === 'IN_PROGRESS' ? (
                          <Badge color="blue">
                            In progress - {activeWorkItem.analysisProgress[activeLensAlias]}%
                          </Badge>
                        ) : activeWorkItem.analysisStatus && activeWorkItem.analysisStatus[activeLensAlias] === 'COMPLETED' ? (
                          <Badge color="green">
                            Completed
                          </Badge>
                        ) : activeWorkItem.analysisStatus && activeWorkItem.analysisStatus[activeLensAlias] === 'FAILED' ? (
                          <Badge color="red">
                            Failed
                          </Badge>
                        ) : <Badge color="grey">Not Started</Badge>}
                      </>
                    ) : isAnalyzing && progressTracking ? (<ProgressBar
                      key="current-lens-analysis-progress-bar"
                      value={Math.round((progressTracking.processedQuestions / progressTracking.totalQuestions) * 100)}
                      description="In progress"
                    />) : !isAnalyzing && progressTracking ? (
                      Math.round((progressTracking.processedQuestions / progressTracking.totalQuestions) * 100) === 100 ? (
                        <Badge color="green">Completed</Badge>
                      ) : (
                        <Badge color="blue">Partial results - Stopped at {Math.round((progressTracking.processedQuestions / progressTracking.totalQuestions) * 100)}%</Badge>
                      )
                    ) : <Badge color="grey">Not Started</Badge>
                    }
                  </SpaceBetween>
                )
              },
              {
                label: "Current Lens Supporting Document",
                value: supportingDocument && supportingDocumentId ? (
                  <SpaceBetween direction="horizontal" size="xxxs" alignItems="center">
                    {supportingDocument.name}
                    {activeWorkItem && (
                      <Button
                        variant="inline-icon"
                        iconName="download"
                        ariaLabel={`Download ${supportingDocument.name}`}
                        loading={downloadingSupportingDocId === supportingDocumentId}
                        onClick={() => handleDownloadSupportingDocument(supportingDocumentId, supportingDocument.name)}
                      />
                    )}
                    {activeWorkItem && (
                      <Popover
                        header="Supporting Document Description"
                        dismissButton={true}
                        position="top"
                        triggerType="custom"
                        content={supportingDocumentDescription}
                      >
                        <Button iconName="status-info" variant="icon" />
                      </Popover>
                    )}
                  </SpaceBetween>
                ) : "N/A"
              }
            ]}
          />
        </Container>
      )}

      {analysisResults && (
        <Tabs
          key="main-results-tabs"
          activeTabId={activeTabId}
          onChange={({ detail }) => {
            setActiveTabId(detail.activeTabId);
            if (detail.activeTabId == 'diff')
              setDocumentViewTabTitle('IaC Document')
          }}
          tabs={[
            {
              id: 'analysis',
              label: 'Analysis Results',
              content: (
                <div key="analysis-tab-content">
                  <AnalysisResults
                    key="analysis-results"
                    results={analysisResults}
                    isAnalyzing={isAnalyzing || isLoadingResults}
                    onDownloadRecommendations={handleDownloadRecommendations}
                    onGenerateIacDocument={handleGenerateIacDocument}
                    isDownloading={isDownloading}
                    isImplementing={isImplementing}
                    isLoadingDetails={isLoadingDetails}
                    setIsLoadingDetails={setIsLoadingDetails}
                    uploadedFileType={uploadedFiles?.singleFile?.type || ''}
                    selectedIaCType={selectedIaCType}
                    setError={setError}
                    fileId={activeWorkItem?.fileId || ''}
                    fileName={uploadedFiles?.singleFile?.name || uploadedFiles?.zipFile?.name || 'unknown_file'}
                    lensAliasArn={activeLensAliasArn}
                    lensName={activeLensName}
                  />
                </div>
              )
            },
            {
              id: 'wat',
              label: 'Well-Architected Tool',
              disabled: isLoadingDetails || isImplementing,
              content: (
                <div key="wat-content">
                  <RiskSummary
                    key="risk-summary"
                    summary={riskSummary}
                    onUpdate={() => handleUpdate(activeWorkItem, currentLensWorkloadId, activeLensAliasArn, currentWorkloadProtected)}
                    onGenerateReport={() => handleGenerateReport(currentLensWorkloadId, activeLensAliasArn)}
                    onDeleteWorkload={() => handleDeleteWorkload(activeWorkItem, activeLensAlias, activeLensAliasArn)}
                    onRefresh={() => handleRefresh(currentLensWorkloadId, activeLensAliasArn)}
                    isUpdating={isUpdating}
                    isRefreshing={isRefreshing || isLoadingResults}
                    isGeneratingReport={isGeneratingReport}
                    isDeleting={isDeleting}
                    canDeleteWorkload={canDeleteWorkload}
                    hasProvidedWorkloadId={!!workloadId}
                    currentWorkloadId={currentLensWorkloadId}
                    awsRegion={awsRegion}
                  />
                </div>
              )
            },
            {
              id: 'diff',
              label: documentViewTabTitle,
              disabled: isLoadingDetails || isImplementing || !updatedDocument,
              content: (
                <div key="diff-content">
                  {updatedDocument && (
                    <DocumentView
                      key="document-view"
                      content={updatedDocument.content}
                      fileName={updatedDocument.name}
                      selectedIaCType={selectedIaCType}
                      lensAlias={activeLensAlias}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      )}
      <Chat
        isAnalysisComplete={isAnalysisComplete}
        fileId={activeWorkItem?.fileId}
        lensName={activeLensName}
      />
    </SpaceBetween>
  );
};
