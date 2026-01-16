import { Box, Link, SpaceBetween, Button } from '@cloudscape-design/components';
import { useLanguage } from '../../contexts/LanguageContext';
import { ReactNode } from 'react';

interface HelpContentItem {
    header: string;
    body: ReactNode;
}

type HelpContentKey = 'default' | 'fileUpload' | 'pillarSelection' | 'analysisResults' | 'wellArchitectedTool' | 'iacDocument' | 'workloadId' | 'iacTypeSelection' | 'supportingDocument' | 'lensSelection';

type HelpContentMap = Record<HelpContentKey, HelpContentItem>;

/**
 * Custom hook to get localized help content based on current language
 * Uses strings from the i18n strings.ts file via useLanguage() context
 */
export const useHelpContent = (): HelpContentMap => {
    const { strings } = useLanguage();
    const h = strings.helpContent;

    return {
        default: {
            header: h.default.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.default.description}
                    </Box>

                    <Box variant="h4">{h.default.keyFeaturesTitle}</Box>
                    <ul>
                        <li><strong>{h.default.iacAnalysis.split(':')[0]}:</strong> {h.default.iacAnalysis.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.default.architectureReview.split(':')[0]}:</strong> {h.default.architectureReview.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.default.analyzerAssistant.split(':')[0]}:</strong> {h.default.analyzerAssistant.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.default.waIntegration.split(':')[0]}:</strong> {h.default.waIntegration.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.default.aiPoweredAnalysis.split(':')[0]}:</strong> {h.default.aiPoweredAnalysis.split(':').slice(1).join(':').trim()}</li>
                    </ul>
                    <Box variant="h4">{h.default.howToUseTitle}</Box>
                    <ol>
                        <li>{h.default.step1}</li>
                        <li>{h.default.step2}</li>
                        <li>{h.default.step3}</li>
                        <li>{h.default.step4}</li>
                        <li>{h.default.step5}</li>
                        <li>{h.default.step6}</li>
                    </ol>

                    <Box variant="h4">{h.default.needHelpTitle}</Box>
                    <Box variant="p">
                        {h.default.needHelpDescription.split('help icons')[0]}
                        <Button variant="inline-icon" iconName="support" />
                        {h.default.needHelpDescription.includes('help icons') ? h.default.needHelpDescription.split('help icons')[1] : ''}
                    </Box>

                    <Box variant="h4">{h.default.additionalResourcesTitle}</Box>
                    <SpaceBetween size="xs">
                        <Link external href="https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html">
                            {h.default.waFrameworkDocLink}
                        </Link>
                        <Link external href="https://docs.aws.amazon.com/wellarchitected/latest/userguide/getting-started.html">
                            {h.default.waToolGettingStartedLink}
                        </Link>
                    </SpaceBetween>
                </SpaceBetween>
            )
        },
        fileUpload: {
            header: h.fileUpload.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.fileUpload.description}
                    </Box>
                    <ul>
                        <li>{h.fileUpload.iacFormats}</li>
                        <li>{h.fileUpload.imageFormats}</li>
                        <li>{h.fileUpload.documentFormats}</li>
                        <li>{h.fileUpload.maxSize}</li>
                    </ul>
                    <Box variant="p">
                        {h.fileUpload.uploadOptions}
                    </Box>
                </SpaceBetween>
            )
        },
        pillarSelection: {
            header: h.pillarSelection.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.pillarSelection.description}
                    </Box>
                    <ul>
                        <li>{h.pillarSelection.operationalExcellence}</li>
                        <li>{h.pillarSelection.security}</li>
                        <li>{h.pillarSelection.reliability}</li>
                        <li>{h.pillarSelection.performanceEfficiency}</li>
                        <li>{h.pillarSelection.costOptimization}</li>
                        <li>{h.pillarSelection.sustainability}</li>
                    </ul>
                    <Link external href="https://docs.aws.amazon.com/wellarchitected/latest/framework/the-pillars-of-the-framework.html">
                        {h.pillarSelection.learnMoreLink}
                    </Link>
                </SpaceBetween>
            )
        },
        analysisResults: {
            header: h.analysisResults.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.analysisResults.description}
                    </Box>
                    <ul>
                        <li>{h.analysisResults.viewBestPractices}</li>
                        <li><strong>{h.analysisResults.statusIndicatorsTitle}</strong>
                            <ul>
                                <li><strong>{h.analysisResults.appliedGreen.split(':')[0]}:</strong> {h.analysisResults.appliedGreen.split(':').slice(1).join(':').trim()}</li>
                                <li><strong>{h.analysisResults.notAppliedRed.split(':')[0]}:</strong> {h.analysisResults.notAppliedRed.split(':').slice(1).join(':').trim()}</li>
                                <li><strong>{h.analysisResults.notRelevantGrey.split(':')[0]}:</strong> {h.analysisResults.notRelevantGrey.split(':').slice(1).join(':').trim()}</li>
                            </ul>
                        </li>
                        <li><strong>{h.analysisResults.getMoreDetails.split(':')[0]}:</strong> {h.analysisResults.getMoreDetails.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.analysisResults.generateIacDocument.split(':')[0]}:</strong> {h.analysisResults.generateIacDocument.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.analysisResults.downloadAnalysis.split(':')[0]}:</strong> {h.analysisResults.downloadAnalysis.split(':').slice(1).join(':').trim()}</li>
                    </ul>
                </SpaceBetween>
            )
        },
        wellArchitectedTool: {
            header: h.wellArchitectedTool.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.wellArchitectedTool.description}
                    </Box>
                    <ul>
                        <li>{h.wellArchitectedTool.viewRiskSummary}</li>
                        <li>{h.wellArchitectedTool.trackRisks}</li>
                        <li>{h.wellArchitectedTool.generateReports}</li>
                    </ul>

                    <Box variant="h4">
                        {h.wellArchitectedTool.workloadManagementTitle}
                    </Box>
                    <ul>
                        <li><strong>{h.wellArchitectedTool.completeReviewTitle}</strong>
                            <ul>
                                <li>{h.wellArchitectedTool.completeReviewWithId}</li>
                                <li>{h.wellArchitectedTool.completeReviewWithoutId}</li>
                            </ul>
                        </li>
                        <li><strong>{h.wellArchitectedTool.deleteWorkloadTitle}</strong>
                            <ul>
                                <li>{h.wellArchitectedTool.deleteWorkloadOnlyCreated}</li>
                                <li>{h.wellArchitectedTool.deleteWorkloadNotExisting}</li>
                                <li>{h.wellArchitectedTool.deleteWorkloadCleanup}</li>
                            </ul>
                        </li>
                    </ul>

                    <Box variant="p">
                        <strong>{h.wellArchitectedTool.securityNote.split(':')[0]}:</strong> {h.wellArchitectedTool.securityNote.split(':').slice(1).join(':').trim()}
                    </Box>

                    <Link external href="https://docs.aws.amazon.com/wellarchitected/latest/userguide/workloads.html">
                        {h.wellArchitectedTool.learnMoreLink}
                    </Link>
                </SpaceBetween>
            )
        },
        iacDocument: {
            header: h.iacDocument.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.iacDocument.description}
                    </Box>
                    <ul>
                        <li>{h.iacDocument.reviewTemplates}</li>
                        <li>{h.iacDocument.copyToClipboard}</li>
                        <li>{h.iacDocument.downloadAsFile}</li>
                    </ul>
                    <Box variant="p">
                        {h.iacDocument.templatesNote}
                    </Box>
                </SpaceBetween>
            )
        },
        workloadId: {
            header: h.workloadId.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.workloadId.description}
                    </Box>
                    <ul>
                        <li>{h.workloadId.optionalCreate}</li>
                        <li>{h.workloadId.selectExisting}</li>
                        <li>{h.workloadId.foundInConsole}</li>
                    </ul>
                    <Link external href="https://docs.aws.amazon.com/wellarchitected/latest/userguide/define-workload.html">
                        {h.workloadId.learnMoreLink}
                    </Link>
                </SpaceBetween>
            )
        },
        iacTypeSelection: {
            header: h.iacTypeSelection.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.iacTypeSelection.description}
                    </Box>
                    <ul>
                        <li><strong>{h.iacTypeSelection.cloudFormation.split(':')[0]}:</strong> {h.iacTypeSelection.cloudFormation.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.iacTypeSelection.terraform.split(':')[0]}:</strong> {h.iacTypeSelection.terraform.split(':').slice(1).join(':').trim()}</li>
                        <li><strong>{h.iacTypeSelection.awsCdkTitle.split(':')[0]}:</strong> {h.iacTypeSelection.awsCdkTitle.split(':').slice(1).join(':').trim()}
                            <ul>
                                <li>{h.iacTypeSelection.typescript}</li>
                                <li>{h.iacTypeSelection.python}</li>
                                <li>{h.iacTypeSelection.go}</li>
                                <li>{h.iacTypeSelection.java}</li>
                                <li>{h.iacTypeSelection.csharp}</li>
                            </ul>
                        </li>
                    </ul>
                    <Box variant="p">
                        {h.iacTypeSelection.availabilityNote}
                    </Box>
                </SpaceBetween>
            )
        },
        supportingDocument: {
            header: h.supportingDocument.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.supportingDocument.description}
                    </Box>
                    <ul>
                        <li><strong>{h.supportingDocument.supportedFormatsTitle}</strong> {h.supportingDocument.supportedFormats}</li>
                        <li><strong>{h.supportingDocument.maxSizeTitle}</strong> {h.supportingDocument.maxSize}</li>
                        <li><strong>{h.supportingDocument.descriptionTitle}</strong> {h.supportingDocument.descriptionText}</li>
                    </ul>
                    <Box variant="p">
                        {h.supportingDocument.usageNote}
                    </Box>
                    <Box variant="p">
                        <strong>{h.supportingDocument.singleDocNote.split(':')[0]}:</strong> {h.supportingDocument.singleDocNote.split(':').slice(1).join(':').trim()}
                    </Box>
                </SpaceBetween>
            )
        },
        lensSelection: {
            header: h.lensSelection.header,
            body: (
                <SpaceBetween size="xxs">
                    <Box variant="p">
                        {h.lensSelection.description}
                    </Box>
                    <ul>
                        <li><strong>{h.lensSelection.waFrameworkTitle}</strong> {h.lensSelection.waFrameworkDescription}</li>
                        <li><strong>{h.lensSelection.specializedLensesTitle}</strong> {h.lensSelection.specializedLensesDescription}</li>
                        <ul>
                            <li>{h.lensSelection.serverlessLens}</li>
                            <li>{h.lensSelection.iotLens}</li>
                            <li>{h.lensSelection.saasLens}</li>
                            <li>{h.lensSelection.otherLenses}</li>
                        </ul>
                    </ul>
                    <Box variant="p">
                        {h.lensSelection.lensExplanation}
                    </Box>
                    <Box variant="h4">{h.lensSelection.whySpecializedTitle}</Box>
                    <Box variant="p">
                        {h.lensSelection.whySpecializedDescription}
                    </Box>
                </SpaceBetween>
            )
        },
    };
};