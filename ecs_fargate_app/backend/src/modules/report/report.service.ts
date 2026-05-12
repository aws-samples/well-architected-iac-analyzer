import { Injectable, Logger } from '@nestjs/common';
import { AwsConfigService } from '../../config/aws.config';
import { GetLensReviewReportCommand } from '@aws-sdk/client-wellarchitected';

interface AnalysisResult {
  pillar: string;
  question: string;
  bestPractices: {
    name: string;
    relevant: boolean;
    applied: boolean;
    reasonApplied?: string;
    reasonNotApplied?: string;
    recommendations?: string;
    criticality?: string;
    criticalityReason?: string;
    complexity?: string;
    complexityReason?: string;
    priority?: string;
    priorityReason?: string;
  }[];
}

@Injectable()
export class ReportService {
  private readonly logger = new Logger(ReportService.name);
  private readonly lensAliasArn = 'arn:aws:wellarchitected::aws:lens/wellarchitected';

  constructor(private readonly awsConfig: AwsConfigService) {}

  async generateReport(workloadId: string, lensAliasArn?: string) {
    try {
      const waClient = this.awsConfig.createWAClient();
      const command = new GetLensReviewReportCommand({
        WorkloadId: workloadId,
        LensAlias: lensAliasArn || this.lensAliasArn,
      });

      const response = await waClient.send(command);
      return response.LensReviewReport?.Base64String;
    } catch (error) {
      this.logger.error('Error generating report:', error);
      throw new Error(error);
    }
  }

  generateRecommendationsCsv(results: AnalysisResult[]): string {
    try {
      const rows = [
        [
          'Pillar',
          'Question',
          'Best Practice',
          'Relevant',
          'Applied',
          'Status Reason',
          'Recommendations',
          'Criticality',
          'Criticality Reason',
          'Complexity',
          'Complexity Reason',
          'Priority',
          'Priority Reason',
        ],
      ];

      for (const result of results) {
        for (const bp of result.bestPractices) {
          rows.push([
            result.pillar,
            result.question,
            bp.name,
            bp.relevant ? 'Yes' : 'No',
            bp.applied ? 'Yes' : 'No',
            bp.applied ? (bp.reasonApplied || '') : (bp.reasonNotApplied || ''),
            bp.recommendations || '',
            bp.criticality || 'N/A',
            bp.criticalityReason || 'N/A',
            bp.complexity || 'N/A',
            bp.complexityReason || 'N/A',
            bp.priority || 'N/A',
            bp.priorityReason || 'N/A',
          ]);
        }
      }

      return rows.map(row => {
        return row.map(cell => {
          const cellStr = String(cell);
          const escapedCell = cellStr.replace(/"/g, '""');
          return `"${escapedCell}"`;
        }).join(',');
      }).join('\n');
    } catch (error) {
      this.logger.error('Error generating recommendations CSV:', error);
      throw new Error(error);
    }
  }
}