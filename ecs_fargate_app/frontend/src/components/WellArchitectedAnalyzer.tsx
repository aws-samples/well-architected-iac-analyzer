import React, { useState, useEffect } from 'react';
import { DocumentView } from './DocumentView';
import { SpaceBetween, Container, Button, StatusIndicator, ProgressBar, Tabs, Alert, ExpandableSection } from '@cloudscape-design/components';
import { FileUpload } from './FileUpload';
import { WorkloadIdInput } from './WorkloadIdInput';
import { PillarSelector } from './PillarSelector';
import { AnalysisResults } from './AnalysisResults';
import { RiskSummary } from './RiskSummary';
import { useAnalyzer } from '../hooks/useAnalyzer';
import { UploadedFile, WellArchitectedPillar, IaCTemplateType, UpdatedDocument } from '../types';
import { analyzerApi } from '../services/api';
import { socketService } from '../services/socket';
import { IaCTemplateSelector } from './IaCTemplateSelector';

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

export const WellArchitectedAnalyzer: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [updatedDocument, setUpdatedDocument] = useState<UpdatedDocument | null>(null);
  const [workloadId, setWorkloadId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState('analysis');
  const [selectedPillars, setSelectedPillars] = useState(
    DEFAULT_PILLARS.filter(p => p.selected).map(p => p.id)
  );
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

  useEffect(() => {
    const cleanup = socketService.onImplementationProgress((progressData: ImplementationProgress) => {
      setImplementationProgress(progressData);
    });

    return () => {
      cleanup();
    };
  }, []);

  const {
    analyze,
    cancelAnalysis,
    isCancellingAnalysis,
    showAnalysisCancellationAlert,
    setShowAnalysisCancellationAlert,
    updateWorkload,
    generateReport,
    downloadRecommendations,
    refreshSummary,
    deleteWorkload,
    setError,
    analysisResults,
    riskSummary,
    isAnalyzing,
    isUpdating,
    error,
    progress,
    isRefreshing,
    isGeneratingReport,
    isDeleting,
    canDeleteWorkload,
    createdWorkloadId,
    showPartialResultsWarning,
    setShowPartialResultsWarning,
    partialResultsError,
  } = useAnalyzer();

  const handleAnalyze = async () => {
    if (!uploadedFile) return;
    await analyze(uploadedFile, workloadId, selectedPillars);
  };

  const handleUpdate = async () => {
    await updateWorkload(workloadId);
  };

  const getFileType = (fileName: string, currentType: string | undefined): string => {
    if (fileName.endsWith('.tf')) return 'application/terraform';
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml')) return 'application/yaml';
    if (fileName.endsWith('.json')) return 'application/json';
    return currentType || 'undefined';
  };

  const handleFileUploaded = (file: UploadedFile) => {
    const processedFile = {
      ...file,
      type: getFileType(file.name, file.type)
    };

    setUploadedFile(processedFile);
    setIsImageFile(processedFile.type.startsWith('image/'));
  };

  const handleGenerateReport = async () => {
    const activeWorkloadId = workloadId || createdWorkloadId;
    if (!activeWorkloadId) return;
    await generateReport(activeWorkloadId);
  };

  const handleRefresh = () => {
    const activeWorkloadId = workloadId || createdWorkloadId;
    if (!activeWorkloadId) return;
    refreshSummary(activeWorkloadId);
  };

  const handleGenerateIacDocument = async () => {
    if (!uploadedFile || !analysisResults) return;

    try {
      setIsImplementing(true);
      setShowGenerationErrorWarning(false);
      setGenerationError(null);

      const result = await analyzerApi.generateIacDocument(
        uploadedFile.name,
        uploadedFile.type,
        analysisResults,
        selectedIaCType
      );

      if (result.error) {
        setShowGenerationErrorWarning(true);
        setGenerationError(result.error);
      }

      if (result.content) {
        setUpdatedDocument({
          content: result.content,
          name: uploadedFile.name,
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
      await downloadRecommendations();
    } finally {
      setIsDownloading(false);
    }
  };

  const acceptedFileTypes = [
    '.yaml', '.yml', '.json', '.tf',  // IaC files
    '.png', '.jpg', '.jpeg',          // Image files
    '.xml', '.txt'                    // Repomix
  ];

  return (
    <SpaceBetween size="l">
      <Container>
        <SpaceBetween size="l">
          <FileUpload
            onFileUploaded={handleFileUploaded}
            acceptedFileTypes={acceptedFileTypes}
          />

          <PillarSelector
            pillars={DEFAULT_PILLARS}
            selectedPillars={selectedPillars}
            onChange={setSelectedPillars}
            disabled={isAnalyzing || isUpdating}
          />

          <ExpandableSection
            variant="inline"
            headerText="Optional settings"
          >
            <SpaceBetween size="l">
              <WorkloadIdInput
                value={workloadId || ''}
                onChange={(value) => setWorkloadId(value || null)}
                optional={true}
                disabled={!!createdWorkloadId}
              />
              <IaCTemplateSelector
                value={selectedIaCType}
                onChange={setSelectedIaCType}
                disabled={isAnalyzing || isUpdating || !isImageFile}
              />
            </SpaceBetween>
          </ExpandableSection>



          {error && (
            <Alert
              type="error"
              dismissible
              onDismiss={() => setError(null)}
              header="Error"
            >
              {error}
            </Alert>
          )}

          <SpaceBetween size="xs" direction="horizontal">
            <Button
              variant="primary"
              onClick={handleAnalyze}
              loading={isAnalyzing}
              disabled={!uploadedFile || selectedPillars.length === 0}
              iconName="gen-ai"
            >
              Review Uploaded Document
            </Button>
            {isAnalyzing && (
              <Button
                onClick={cancelAnalysis}
                iconName="close"
                disabled={isCancellingAnalysis || !progress}
                loading={isCancellingAnalysis}
              >
                {isCancellingAnalysis ? 'Cancelling...' : 'Cancel Review'}
              </Button>
            )}
          </SpaceBetween>
        </SpaceBetween>
      </Container>

      {isAnalyzing && progress && (
        <Container>
          <SpaceBetween size="m">
            <StatusIndicator type="in-progress">
              [{progress.processedQuestions}/{progress.totalQuestions}] Analyzing uploaded file according to:
              '{progress.currentPillar} - {progress.currentQuestion}'
            </StatusIndicator>
            <ProgressBar
              value={Math.round((progress.processedQuestions / progress.totalQuestions) * 100)}
              description="Analysis progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {isImplementing && implementationProgress && (
        <Container>
          <SpaceBetween size="m">
            <StatusIndicator type="in-progress">
              {implementationProgress.status}
            </StatusIndicator>
            <ProgressBar
              value={implementationProgress.progress}
              description="IaC document generation progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {isLoadingDetails && implementationProgress && (
        <Container>
          <SpaceBetween size="m">
            <StatusIndicator type="in-progress">
              {implementationProgress.status}
            </StatusIndicator>
            <ProgressBar
              value={implementationProgress.progress}
              description="Analysis progress"
            />
          </SpaceBetween>
        </Container>
      )}

      {showAnalysisCancellationAlert && (
        <Alert
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
          onDismiss={() => setShowGenerationErrorWarning(false)}
          dismissible
          type="warning"
          header="Partial IaC Document Generation"
        >
          {generationError + ' ' || 'Template generation was interrupted. Showing partial results.'}
          You can try generating the complete document again after waiting a few minutes.
        </Alert>
      )}

      {analysisResults && (
        <Tabs
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
                <AnalysisResults
                  results={analysisResults}
                  isAnalyzing={isAnalyzing}
                  onDownloadRecommendations={handleDownloadRecommendations}
                  onGenerateIacDocument={handleGenerateIacDocument}
                  isDownloading={isDownloading}
                  isImplementing={isImplementing}
                  uploadedFileName={uploadedFile?.name || ''}
                  isLoadingDetails={isLoadingDetails}
                  setIsLoadingDetails={setIsLoadingDetails}
                  uploadedFileType={uploadedFile?.type || ''}
                  selectedIaCType={selectedIaCType}
                  setError={setError}
                />
              )
            },
            {
              id: 'wat',
              label: 'Well-Architected Tool',
              disabled: isLoadingDetails || isImplementing,
              content: (
                <div>
                  <RiskSummary
                    summary={riskSummary}
                    onUpdate={handleUpdate}
                    onGenerateReport={handleGenerateReport}
                    onDeleteWorkload={deleteWorkload}
                    onRefresh={handleRefresh}
                    isUpdating={isUpdating}
                    isRefreshing={isRefreshing}
                    isGeneratingReport={isGeneratingReport}
                    isDeleting={isDeleting}
                    canDeleteWorkload={canDeleteWorkload}
                    hasProvidedWorkloadId={!!workloadId}
                  />
                </div>
              )
            },
            {
              id: 'diff',
              label: documentViewTabTitle,
              disabled: isLoadingDetails || isImplementing || !updatedDocument,
              content: (
                <div>
                  {updatedDocument && (
                    <DocumentView
                      content={updatedDocument.content}
                      fileName={updatedDocument.name}
                      selectedIaCType={selectedIaCType}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      )}
    </SpaceBetween>
  );
};