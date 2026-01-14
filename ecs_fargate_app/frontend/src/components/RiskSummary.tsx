import React, { useState } from 'react';
import {
  Container,
  StatusIndicator,
  Table,
  Button,
  SpaceBetween,
  Header,
  KeyValuePairs,
  ButtonDropdown,
  Badge,
  Link,
  Modal,
} from '@cloudscape-design/components';
import { HelpButton } from './utils/HelpButton';
import { RiskSummary as RiskSummaryType, RiskSummaryProps } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

export const RiskSummary: React.FC<RiskSummaryProps> = ({
  summary,
  onUpdate,
  onGenerateReport,
  onDeleteWorkload,
  onRefresh,
  isUpdating,
  isRefreshing,
  isGeneratingReport,
  isDeleting,
  canDeleteWorkload,
  hasProvidedWorkloadId,
  currentWorkloadId,
  awsRegion
}) => {
  const totalHighRisks = summary?.reduce((acc, s) => acc + s.highRisks, 0) ?? 0;
  const totalMediumRisks = summary?.reduce((acc, s) => acc + s.mediumRisks, 0) ?? 0;
  const totalQuestions = summary?.reduce((acc, s) => acc + s.totalQuestions, 0) ?? 0;
  const totalAnswered = summary?.reduce((acc, s) => acc + s.answeredQuestions, 0) ?? 0;
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const { strings } = useLanguage();

  const dropdownItems = [
    {
      id: 'generate-report',
      text: strings.riskSummary.generateReport,
      disabled: !summary || isUpdating || isGeneratingReport
    },
    {
      id: 'delete-workload',
      text: strings.riskSummary.deleteWorkload,
      disabled: !canDeleteWorkload || hasProvidedWorkloadId || isDeleting
    }
  ];

  const handleDropdownAction = ({ detail: { id } }: { detail: { id: string } }) => {
    switch (id) {
      case 'generate-report':
        onGenerateReport();
        break;
      case 'delete-workload':
        setDeleteModalVisible(true);
        break;
    }
  };

  // Handler for confirming deletion
  const confirmDelete = () => {
    onDeleteWorkload();
    setDeleteModalVisible(false);
  };

  return (
    <div>
      <Container
        variant="stacked"
      >
        <KeyValuePairs
          columns={4}
          items={[
            {
              label: strings.riskSummary.workloadId,
              value: currentWorkloadId ? (
                <SpaceBetween direction="horizontal" size="xxxs" alignItems="center">
                  <Badge color="blue">{currentWorkloadId}</Badge>
                  {currentWorkloadId && awsRegion && (
                    <Link
                      external
                      href={`https://${awsRegion}.console.aws.amazon.com/wellarchitected/home?region=${awsRegion}#/workload/${currentWorkloadId}/overview`}
                      variant="info"
                    />
                  )}
                </SpaceBetween>
              ) : <Badge color="grey">{strings.riskSummary.noWorkloadIdAssociated}</Badge>
            },
            {
              label: strings.riskSummary.questionsAnswered,
              value: isRefreshing || isUpdating || isDeleting ?
                <StatusIndicator type="loading">{strings.common.loading}</StatusIndicator> :
                <StatusIndicator type="info">{totalAnswered}/{totalQuestions}</StatusIndicator>
            },
            {
              label: strings.riskSummary.highRisks,
              value: isRefreshing || isUpdating || isDeleting ?
                <StatusIndicator type="loading">{strings.common.loading}</StatusIndicator> :
                <StatusIndicator type="error">{totalHighRisks}</StatusIndicator>
            },
            {
              label: strings.riskSummary.mediumRisks,
              value: isRefreshing || isUpdating || isDeleting ?
                <StatusIndicator type="loading">{strings.common.loading}</StatusIndicator> :
                <StatusIndicator type="warning">{totalMediumRisks}</StatusIndicator>
            }
          ]}
        />
      </Container>
      <Table
        variant="stacked"
        columnDefinitions={[
          { id: 'pillar', header: strings.riskSummary.pillar, cell: item => item.pillarName },
          {
            id: 'progress',
            header: strings.riskSummary.progress,
            cell: (item: RiskSummaryType) => {
              const { answeredQuestions, totalQuestions } = item;
              return `${answeredQuestions}/${totalQuestions}`;
            }
          },
          { id: 'high', header: strings.riskSummary.highRisks, cell: item => item.highRisks },
          { id: 'medium', header: strings.riskSummary.mediumRisks, cell: item => item.mediumRisks },
        ]}
        loading={isRefreshing || isUpdating || isDeleting}
        loadingText={strings.riskSummary.loadingRiskSummary}
        items={summary || []}
        header={
          <Header
            variant="h3"
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <ButtonDropdown
                  items={dropdownItems}
                  loading={isUpdating || isGeneratingReport}
                  loadingText={strings.common.loading}
                  onItemClick={handleDropdownAction}
                  expandToViewport={true}
                  mainAction={{
                    text: strings.riskSummary.completeReview,
                    onClick: onUpdate
                  }}
                />
                <Button
                  iconName="refresh"
                  variant="icon"
                  onClick={onRefresh}
                  loading={isRefreshing}
                  disabled={!summary || isUpdating || isDeleting}
                />
              </SpaceBetween>
            }
            info={<HelpButton contentId="wellArchitectedTool" />}
          >
            {strings.riskSummary.title}
          </Header>
        }
      />
      <Modal
        visible={deleteModalVisible}
        onDismiss={() => setDeleteModalVisible(false)}
        header={strings.riskSummary.deleteWorkloadModal.title}
        footer={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              onClick={() => setDeleteModalVisible(false)}
              variant="link"
              disabled={isDeleting}
            >
              {strings.common.cancel}
            </Button>
            <Button
              onClick={confirmDelete}
              variant="primary"
              loading={isDeleting}
            >
              {strings.common.delete}
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="m">
          <div>
            {strings.riskSummary.deleteWorkloadModal.confirmMessage} "{currentWorkloadId}"?
            {' '}{strings.riskSummary.deleteWorkloadModal.cannotUndo}
          </div>
          <div>
            <strong>{strings.riskSummary.deleteWorkloadModal.note}</strong> {strings.riskSummary.deleteWorkloadModal.noteMessage}
          </div>
        </SpaceBetween>
      </Modal>
    </div>
  );
};