import React, { useState } from 'react';
import {
  Table,
  Box,
  StatusIndicator,
  Link,
  PropertyFilter,
  Pagination,
  CollectionPreferences,
  Button,
  Header,
  Container,
  KeyValuePairs,
  SpaceBetween,
} from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { useCollection } from '@cloudscape-design/collection-hooks';
import { AnalysisResult, BestPractice, IaCTemplateType } from '../types';
import { DetailsModal } from './DetailsModal';
import { analyzerApi } from '../services/api';
import {
  tableFilteringProperties,
  paginationLabels,
  getMatchesCountText,
  propertyFilterI18nStrings,
} from './utils/table-configs/analysis-table-config';

interface AnalysisResultsProps {
  results: AnalysisResult[];
  isAnalyzing: boolean;
  onDownloadRecommendations: () => void;
  onGenerateIacDocument: () => void;
  isDownloading: boolean;
  isImplementing: boolean;
  uploadedFileName: string;
  isLoadingDetails: boolean;
  setIsLoadingDetails: (loading: boolean) => void;
  uploadedFileType: string;
  selectedIaCType: IaCTemplateType;
  setError: (error: string | null) => void;
}

interface EnhancedBestPractice extends BestPractice {
  pillar: string;
  question: string;
  questionId: string;
}

interface PreferencesType {
  pageSize: number;
  visibleContent: readonly string[];
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({ results, isAnalyzing, onDownloadRecommendations, onGenerateIacDocument, isDownloading, isImplementing, uploadedFileName, isLoadingDetails, setIsLoadingDetails, uploadedFileType, selectedIaCType, setError }) => {
  const [preferences, setPreferences] = useState<PreferencesType>({
    pageSize: 10,
    visibleContent: ['pillar', 'question', 'name', 'status', 'reason', 'recommendations'],
  });
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [detailsContent, setDetailsContent] = useState('');
  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleGetMoreDetails = async () => {
    try {
      setIsLoadingDetails(true);
      setDetailsError(null);

      const result = await analyzerApi.getMoreDetails(
        selectedItems,
        uploadedFileName,
        uploadedFileType,
        selectedIaCType
      );

      if (result.error) {
        setDetailsError(result.error);
      }

      if (result.content) {
        setDetailsContent(result.content);
        setDetailsModalVisible(true);
      } else {
        setError('No content received from analysis');
      }
    } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to get detailed analysis');
    } finally {
        setIsLoadingDetails(false);
    }
  };

  const getBestPracticeCounts = (practices: EnhancedBestPractice[]) => {
    return practices.reduce(
      (acc, practice) => ({
        applied: acc.applied + (practice.applied ? 1 : 0),
        notApplied: acc.notApplied + (practice.applied ? 0 : 1),
      }),
      { applied: 0, notApplied: 0 }
    );
  };

  // Transform the nested structure into a flat array
  const flattenedBestPractices: EnhancedBestPractice[] = results.flatMap(result =>
    result.bestPractices.map(bp => ({
      ...bp,
      pillar: result.pillar,
      question: result.question,
      questionId: result.questionId,
    }))
  );

  const { applied, notApplied } = getBestPracticeCounts(flattenedBestPractices);

  const { items, actions, filteredItemsCount, collectionProps, propertyFilterProps, paginationProps } = useCollection(
    flattenedBestPractices,
    {
      propertyFiltering: {
        filteringProperties: tableFilteringProperties,
        empty: (
          <Box textAlign="center" color="inherit">
            <b>No best practices found</b>
          </Box>
        ),
        noMatch: (
          <Box textAlign="center" color="inherit">
            <b>No matches</b>
            <Box color="inherit" padding={{ top: 's' }}>
              <Button onClick={() => actions.setPropertyFiltering({ tokens: [], operation: 'and' })}>
                Clear filter
              </Button>
            </Box>
          </Box>
        ),
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: { defaultState: { sortingColumn: { sortingField: 'pillar' } } },
    }
  );

  const handleCancelGeneration = async () => {
    try {
      await analyzerApi.cancelIaCGeneration();
    } catch (error) {
      console.error('Failed to cancel IaC generation:', error);
    }
  };

  return (
    <div>
      <Container
        variant="stacked"
      >
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: "Best Practices Applied",
              value: isAnalyzing ?
                <StatusIndicator type="loading">Loading</StatusIndicator> :
                <StatusIndicator>{applied}</StatusIndicator>
            },
            {
              label: "Best Practices Not Applied",
              value: isAnalyzing ?
                <StatusIndicator type="loading">Loading</StatusIndicator> :
                <StatusIndicator type="error">{notApplied}</StatusIndicator>
            }
          ]}
        />
      </Container>
      <Table
        {...collectionProps}
        variant="stacked"
        header={
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  onClick={handleGetMoreDetails}
                  loading={isLoadingDetails}
                  disabled={selectedItems.length === 0 || isLoadingDetails}
                  iconName="gen-ai"
                >
                  Get More Details
                </Button>
                <Button
                  onClick={onGenerateIacDocument}
                  loading={isImplementing}
                  disabled={isDownloading || isImplementing || !uploadedFileType.startsWith('image/')}
                  iconName="gen-ai"
                >
                  Generate IaC Document
                </Button>
                {isImplementing && (
                  <Button
                    onClick={handleCancelGeneration}
                    iconName="close"
                  >
                    Cancel IaC Generation
                  </Button>
                )}
                <Button
                  onClick={onDownloadRecommendations}
                  loading={isDownloading}
                  disabled={isDownloading || isImplementing}
                  iconName="download"
                >
                  Download Analysis
                </Button>
              </SpaceBetween>
            }
            info={<HelpButton contentId="analysisResults" />}
          >
            Analysis Results
          </Header>
        }
        columnDefinitions={[
          {
            id: 'pillar',
            header: 'Pillar',
            cell: item => item.pillar,
            sortingField: 'pillar',
          },
          {
            id: 'question',
            header: 'Question',
            cell: item => item.question,
            sortingField: 'question',
          },
          {
            id: 'name',
            header: 'Best Practice',
            cell: item => (
              <Link external href={`https://docs.aws.amazon.com/wellarchitected/latest/framework/${item.id}.html`}>
                {item.name}
              </Link>
            ),
            sortingField: 'name',
            minWidth: 200,
          },
          {
            id: 'status',
            header: 'Status',
            cell: item => (
              <StatusIndicator type={item.applied ? 'success' : 'error'}>
                {item.applied ? 'Applied' : 'Not Applied'}
              </StatusIndicator>
            ),
            sortingField: 'applied',
            minWidth: 140,
          },
          {
            id: 'reason',
            header: 'Reason',
            cell: item => item.applied ? item.reasonApplied : item.reasonNotApplied,
            minWidth: 200,
          },
          {
            id: 'recommendations',
            header: 'Recommendations',
            cell: item => !item.applied && item.recommendations || 'N/A',
            minWidth: 500,
          },
        ]}
        items={items}
        loadingText="Analyzing uploaded file..."
        loading={isAnalyzing}
        columnDisplay={preferences.visibleContent.map(id => ({ id, visible: true }))}
        wrapLines
        stickyHeader
        selectionType="multi"
        selectedItems={selectedItems}
        onSelectionChange={({ detail }) =>
          setSelectedItems(detail.selectedItems)
        }
        ariaLabels={{
          allItemsSelectionLabel: ({ selectedItems }) =>
            `${selectedItems.length} ${selectedItems.length === 1 ? "item" : "items"
            } selected`,
          itemSelectionLabel: ({ selectedItems }, item) => {
            const isItemSelected = selectedItems.filter(i => i.id === item.id).length > 0;
            return `"${item.name}" is ${isItemSelected ? "" : "not "}selected`;
          }
        }}
        trackBy='name'
        filter={
          <PropertyFilter
            {...propertyFilterProps}
            i18nStrings={propertyFilterI18nStrings}
            countText={getMatchesCountText(filteredItemsCount || 0)}
            expandToViewport
          />
        }
        pagination={<Pagination {...paginationProps} ariaLabels={paginationLabels} />}
        preferences={
          <CollectionPreferences
            title="Preferences"
            confirmLabel="Confirm"
            cancelLabel="Cancel"
            preferences={preferences}
            onConfirm={({ detail }) => setPreferences({
              pageSize: detail.pageSize || 10,
              visibleContent: detail.visibleContent || [],
            })}
            pageSizePreference={{
              title: 'Page size',
              options: [
                { value: 10, label: '10 best practices' },
                { value: 25, label: '25 best practices' },
                { value: 50, label: '50 best practices' },
                { value: 100, label: '100 best practices' },
              ],
            }}
          />
        }
      />
      <DetailsModal
        visible={detailsModalVisible}
        onDismiss={() => setDetailsModalVisible(false)}
        content={detailsContent}
        error={detailsError || undefined}
      />
    </div>
  );
};