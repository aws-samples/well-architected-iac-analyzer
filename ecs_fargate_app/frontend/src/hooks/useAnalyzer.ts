import { useState, useEffect } from 'react';
import { analyzerApi } from '../services/api';
import { socketService } from '../services/socket';
import { AnalysisResult, RiskSummary, FileUploadMode, WorkloadIdInfo } from '../types';

export const useAnalyzer = () => {
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[] | null>(null);
  const [riskSummary, setRiskSummary] = useState<RiskSummary[] | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    processedQuestions: number;
    totalQuestions: number;
    currentPillar: string;
    currentQuestion: string;
  } | null>(null);
  const [progressTracking, setProgressTracking] = useState<{
    processedQuestions: number;
    totalQuestions: number;
    currentPillar: string;
    currentQuestion: string;
  } | null>(null);
  const [createdWorkloadId, setCreatedWorkloadId] = useState<string | undefined>(undefined);
  const [canDeleteWorkload, setCanDeleteWorkload] = useState(false);
  const [showAnalysisCancellationAlert, setShowAnalysisCancellationAlert] = useState(false);
  const [isCancellingAnalysis, setIsCancellingAnalysis] = useState(false);
  const [showPartialResultsWarning, setShowPartialResultsWarning] = useState(false);
  const [partialResultsError, setPartialResultsError] = useState<string | null>(null);
  const [currentLensWorkloadId, setCurrentLensWorkloadId] = useState<string | undefined>(undefined);
  const [awsRegion, setAwsRegion] = useState<string | undefined>(undefined);

  useEffect(() => {
    const cleanup = socketService.onAnalysisProgress((progressData) => {
      setProgress(progressData);
      setProgressTracking(progressData);
    });

    return () => {
      cleanup();
      socketService.disconnect();
    };
  }, []);

  const analyze = async (
    fileId: string,
    workloadId: string | undefined,
    selectedPillars: string[],
    uploadMode?: FileUploadMode,
    supportingDocumentId?: string | null,
    supportingDocumentDescription?: string | null,
    lensAliasArn?: string | null,
    lensName?: string | null,
    lensPillars?: Record<string, string> | null,
    _isTempWorkloadParam?: boolean, // Renamed with underscore to indicate it's not used
    outputLanguage?: string
  ): Promise<{ results: AnalysisResult[]; isCancelled: boolean; error?: string; fileId?: string; isNetworkInterruption?: boolean }> => {
    setIsAnalyzing(true);
    setError(null);
    setProgress(null);
    setShowPartialResultsWarning(false);
    setPartialResultsError(null);
    let tempWorkloadId: string | null = null;
    let isTempWorkload: boolean = true;
  
    try {
      // Create temp workload if no workloadId provided
      if (!workloadId) {
        tempWorkloadId = await analyzerApi.createWorkload(true, lensAliasArn ?? undefined);
        workloadId = tempWorkloadId;
        isTempWorkload = true;
      } else if (lensAliasArn) {
        // If workloadId is provided, associate the selected lensAliasArn
        await analyzerApi.associateLenses(workloadId, lensAliasArn);

        // This is a user-provided workload, update current lens workload ID but mark as protected
        setCurrentLensWorkloadId(workloadId);
        setCanDeleteWorkload(false);
        isTempWorkload = false;
      }
  
      const { results, isCancelled, error: analysisError, fileId: resultFileId } = await analyzerApi.analyze(
        fileId,
        workloadId,
        selectedPillars,
        uploadMode,
        supportingDocumentId || undefined,
        supportingDocumentDescription || undefined,
        lensAliasArn || undefined,
        lensName || undefined,
        lensPillars || undefined,
        isTempWorkload,
        outputLanguage
      );
  
      setAnalysisResults(results);
  
      if (isCancelled) {
        setShowAnalysisCancellationAlert(true);
      } else if (analysisError) {
        setShowPartialResultsWarning(true);
        setPartialResultsError(analysisError);
      }
  
      // Delete temp workload if it was created
      if (tempWorkloadId) {
        await analyzerApi.deleteWorkload(tempWorkloadId);
      }
  
      return { results, isCancelled, error: analysisError, fileId: resultFileId };
  
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analysis failed';

      // Detect network interruptions
      const isNetworkInterruption = errorMessage.includes('NETWORK_INTERRUPTION:');
      
      // Clean up the error message for display
      const displayMessage = isNetworkInterruption 
        ? errorMessage.replace('NETWORK_INTERRUPTION: ', '')
        : errorMessage;

      setError(displayMessage);
  
      // If we have any results, show partial results warning
      if (analysisResults && analysisResults.length > 0) {
        setShowPartialResultsWarning(true);
        setPartialResultsError('Analysis failed unexpectedly. Showing partial results.');
      }
  
      // Return a failure result
      return {
        results: analysisResults || [],
        isCancelled: false,
        error: displayMessage,
        isNetworkInterruption
      };
  
    } finally {
      setIsAnalyzing(false);
      setIsCancellingAnalysis(false);
      setProgress(null);
    }
  };

  const cancelAnalysis = async () => {
    try {
      setIsCancellingAnalysis(true);
      await analyzerApi.cancelAnalysis();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel analysis');
    }
  };

  const updateWorkload = async (providedWorkloadId: string | undefined, lensAliasArn?: string, activeWorkItem?: any, workloadProtected: boolean = false) => {
    if (!analysisResults) return;
  
    setIsUpdating(true);
    setError(null);
    try {
      let workloadId = providedWorkloadId;
      const lensAlias = lensAliasArn?.split('/')?.pop();
      let isProtected = false;
  
      // Create new workload if no workloadId provided
      if (!workloadId) {
        workloadId = await analyzerApi.createWorkload(false, lensAliasArn);
        setCreatedWorkloadId(workloadId);
        setCanDeleteWorkload(true);
        isProtected = false; // Created by the tool, not protected
      } else if (lensAliasArn) {
        // If workloadId is provided, associate the selected lensAliasArn
        await analyzerApi.associateLenses(workloadId, lensAliasArn);
        isProtected = workloadProtected; // Workload id provided, protected if provided by end-user
        setCanDeleteWorkload(!workloadProtected);
      }

      // Update the current lens workload ID
      setCurrentLensWorkloadId(workloadId);
  
      for (const result of analysisResults) {
        // Find the best practices that are applicable (relevant === true) and selected (applied === true)
        const appliedBestPractices = result.bestPractices
          .filter(bp => bp.relevant && bp.applied)
          .map(bp => bp.id);

        // Find the best practices that are applicable (relevant === true) and NOT selected (applied === false)
        const notAppliedBestPractices = result.bestPractices
          .filter(bp => bp.relevant && !bp.applied)
          .map(bp => bp.id);
  
        // Find the best practices that are not applicable (relevant === false)
        const notApplicableBestPractices = result.bestPractices
          .filter(bp => !bp.relevant)
          .map(bp => bp.id);
  
        // Only update the answer if there are applicable or non-applicable best practices
        if (appliedBestPractices.length > 0 || notApplicableBestPractices.length > 0 || notAppliedBestPractices.length > 0) {
          await analyzerApi.updateWorkload(
            workloadId,
            result.questionId,
            appliedBestPractices,
            notApplicableBestPractices,
            notAppliedBestPractices,
            lensAliasArn
          );
        }
      }
  
      const milestoneName = `Review completed on ${new Date().toISOString()}`;
      await analyzerApi.createMilestone(workloadId, milestoneName);
  
      const response = await analyzerApi.getRiskSummary(workloadId, lensAliasArn);
      setRiskSummary(response.summaries);
      setAwsRegion(response.region);

      // If we have a workItem and a lens alias, update the workloadIds map in storage
      if (activeWorkItem?.fileId && lensAlias) {
        // Update the workloadIds map in the work item
        const workloadIdInfo: WorkloadIdInfo = {
          id: workloadId,
          protected: isProtected,
          lastUpdated: new Date().toISOString()
        };
        
        const workloadIds = {
          ...(activeWorkItem.workloadIds || {}),
          [lensAlias]: workloadIdInfo
        };
        
        try {
          await analyzerApi.updateWorkItem(
            activeWorkItem.fileId, 
            { 
              workloadIds,
              lastModified: new Date().toISOString()
            }
          );
        } catch (err) {
          console.warn('Failed to update work item with workload ID:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteWorkload = async (activeWorkItem?: any, lensAlias?: string) => {
    // Skip if no current lens workload ID or if we don't have permission to delete
    if (!currentLensWorkloadId || !canDeleteWorkload) return;
  
    setIsDeleting(true);
    try {
      // Delete the workload in the Well-Architected tool
      await analyzerApi.deleteWorkload(currentLensWorkloadId);
      
      // If we have an active work item and current lens alias, update the DynamoDB record
      if (activeWorkItem?.fileId && lensAlias) {
        try {
          // Update the work item in DynamoDB
          await analyzerApi.updateWorkItem(
            activeWorkItem.fileId,
            {
              workloadIds: {},
              lastModified: new Date().toISOString()
            }
          );
        } catch (updateErr) {
          console.warn('Failed to update work item after deleting workload:', updateErr);
        }
      }
      
      // Reset state after successful deletion
      setCreatedWorkloadId(undefined);
      setCurrentLensWorkloadId(undefined);
      setCanDeleteWorkload(false);
      setRiskSummary(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workload');
    } finally {
      setIsDeleting(false);
    }
  };

  const generateReport = async (workloadId: string, originalFileName: string = 'unknown_file', lensAliasArn?: string) => {
    setIsGeneratingReport(true);
    try {
      const base64String = await analyzerApi.generateReport(workloadId, lensAliasArn);
      if (!base64String) {
        throw new Error('No report data received');
      }

      const safeFileName = originalFileName.replace(/\./g, '_');

      // Convert base64 to Blob and download
      const binaryString = window.atob(base64String);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const lensAlias = lensAliasArn?.split('/')?.pop();

      // Add lens alias to the file name
      a.download = `IaCAnalyzer_Review_Report_${lensAlias}_${safeFileName}.pdf`;

      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadRecommendations = async (originalFileName: string = 'unknown_file', lensAlias?: string) => {
    if (!analysisResults) return;

    try {
      const safeFileName = originalFileName.replace(/\./g, '_');

      const csv = await analyzerApi.generateRecommendations(analysisResults);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `IaCAnalyzer_${lensAlias}_Analysis_Results_${safeFileName}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download recommendations');
    }
  };

  const refreshSummary = async (workloadId: string, lensAliasArn?: string) => {
    setIsRefreshing(true);
    try {
      // Ensure workloadId is a string and not an object
      const workloadIdToUse = typeof workloadId === 'string' ? 
        workloadId : 
        (workloadId as any)?.id || workloadId;
        
      if (!workloadIdToUse || typeof workloadIdToUse !== 'string') {
        throw new Error('Invalid workload ID. Expected a string but received: ' + JSON.stringify(workloadId));
      }
      
      const response = await analyzerApi.getRiskSummary(workloadIdToUse, lensAliasArn);
      setRiskSummary(response.summaries);
      setAwsRegion(response.region);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh summary');
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    analyze,
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
    createdWorkloadId,
    setCreatedWorkloadId,
    canDeleteWorkload,
    setCanDeleteWorkload,
    isDeleting,
    cancelAnalysis,
    isCancellingAnalysis,
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
  };
};