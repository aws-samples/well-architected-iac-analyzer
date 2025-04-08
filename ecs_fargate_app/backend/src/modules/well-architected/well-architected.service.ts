import { Injectable, Logger } from '@nestjs/common';
import { AwsConfigService } from '../../config/aws.config';
import {
  GetLensReviewCommand,
  ListAnswersCommand,
  UpdateAnswerCommand,
  CreateMilestoneCommand,
  CreateWorkloadCommand,
  DeleteWorkloadCommand,
  AssociateLensesCommand,
} from '@aws-sdk/client-wellarchitected';
import { randomBytes, randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

interface ChoiceUpdate {
  Status: 'SELECTED' | 'NOT_APPLICABLE' | 'UNSELECTED';
  Reason?: 'OUT_OF_SCOPE' | 'BUSINESS_PRIORITIES' | 'ARCHITECTURE_CONSTRAINTS' | 'OTHER' | 'NONE';
  Notes?: string;
}

@Injectable()
export class WellArchitectedService {
  private readonly logger = new Logger(WellArchitectedService.name);
  private readonly lensAliasArn = 'arn:aws:wellarchitected::aws:lens/wellarchitected';
  private readonly dynamoClient: DynamoDBClient;
  private readonly lensMetadataTable: string;

  constructor(
    private readonly awsConfig: AwsConfigService,
    private readonly configService: ConfigService,
  ) { 
    this.dynamoClient = this.awsConfig.createDynamoDBClient();
    this.lensMetadataTable = this.configService.get<string>('aws.ddb.lensMetadataTable');
  }

  async getLensMetadata() {
    try {
      const command = new ScanCommand({
        TableName: this.lensMetadataTable,
      });

      const response = await this.dynamoClient.send(command);
      
      if (!response.Items || response.Items.length === 0) {
        return [];
      }

      // Convert DynamoDB items to plain JavaScript objects
      return response.Items.map(item => {
        const unmarshalledItem = unmarshall(item);
        
        // Convert lensPillars from a record with nested properties to a simple key-value map
        if (unmarshalledItem.lensPillars && typeof unmarshalledItem.lensPillars === 'object') {
          const simplifiedPillars = {};
          Object.keys(unmarshalledItem.lensPillars).forEach(key => {
            if (typeof unmarshalledItem.lensPillars[key] === 'object' && 'S' in unmarshalledItem.lensPillars[key]) {
              simplifiedPillars[key] = unmarshalledItem.lensPillars[key].S;
            } else {
              simplifiedPillars[key] = unmarshalledItem.lensPillars[key];
            }
          });
          unmarshalledItem.lensPillars = simplifiedPillars;
        }
        
        return unmarshalledItem;
      });
    } catch (error) {
      this.logger.error('Error retrieving lens metadata from DynamoDB:', error);
      throw new Error(`Failed to retrieve lens metadata: ${error.message}`);
    }
  }

  async getLensReview(workloadId: string) {
    const waClient = this.awsConfig.createWAClient();
    const command = new GetLensReviewCommand({
      WorkloadId: workloadId,
      LensAlias: this.lensAliasArn,
    });

    try {
      return await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error getting lens review for workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  async listAnswers(workloadId: string, pillarId: string, lensAlias?: string) {
    const waClient = this.awsConfig.createWAClient();
    const command = new ListAnswersCommand({
      WorkloadId: workloadId,
      LensAlias: lensAlias || this.lensAliasArn, 
      PillarId: pillarId,
    });

    try {
      return await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error listing answers for workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  async updateAnswer(
    workloadId: string, 
    questionId: string, 
    selectedChoices: string[],
    notApplicableChoices: string[] = [],
    notSelectedChoices: string[],
    lensAliasArn?: string
  ) {
    const waClient = this.awsConfig.createWAClient();
    
    // Create ChoiceUpdates using our defined interface
    const choiceUpdates: Record<string, ChoiceUpdate> = {};
    
    // Add each non-applicable choice to the choiceUpdates object with the string literal
    notApplicableChoices.forEach(choiceId => {
      choiceUpdates[choiceId] = { 
        Status: 'NOT_APPLICABLE'
      };
    });

    // Add each not-selected/not-applied choice to the choiceUpdates object with the string literal
    notSelectedChoices.forEach(choiceId => {
      choiceUpdates[choiceId] = { 
        Status: 'UNSELECTED'
      };
    });

    // Create an UpdateAnswerCommand with the appropriate parameters
    const params: any = {
      WorkloadId: workloadId,
      LensAlias: lensAliasArn || this.lensAliasArn, 
      QuestionId: questionId,
      SelectedChoices: selectedChoices,
      Notes: 'Updated from WA IaC Analyzer app'
    };

    // Only add ChoiceUpdates if there are any NOT_APPLICABLE choices
    if (Object.keys(choiceUpdates).length > 0) {
      params.ChoiceUpdates = choiceUpdates;
    }

    const command = new UpdateAnswerCommand(params);

    try {
      return await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error updating answer for workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  async createMilestone(workloadId: string, milestoneName: string) {
    const waClient = this.awsConfig.createWAClient();
    const command = new CreateMilestoneCommand({
      WorkloadId: workloadId,
      MilestoneName: milestoneName,
    });

    try {
      return await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error creating milestone for workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  async getRiskSummary(workloadId: string, lensAliasArn?: string) {
    try {
      // Use the provided lens alias or default to wellarchitected
      const usedLensAliasArn = lensAliasArn || this.lensAliasArn;
      
      // Get lens review for the selected lens
      const waClient = this.awsConfig.createWAClient();
      const command = new GetLensReviewCommand({
        WorkloadId: workloadId,
        LensAlias: usedLensAliasArn,
      });
      
      const review = await waClient.send(command);
      const summaries = [];

      for (const pillarSummary of review.LensReview?.PillarReviewSummaries || []) {
        // List answers for this pillar using the selected lens
        const answers = await this.listAnswers(workloadId, pillarSummary.PillarId, usedLensAliasArn);

        const summary = {
          pillarName: pillarSummary.PillarName!,
          totalQuestions: 0,
          answeredQuestions: 0,
          highRisks: 0,
          mediumRisks: 0,
        };

        for (const answer of answers.AnswerSummaries || []) {
          summary.totalQuestions++;
          if (answer.Risk !== 'UNANSWERED') {
            summary.answeredQuestions++;
            if (answer.Risk === 'HIGH') summary.highRisks++;
            if (answer.Risk === 'MEDIUM') summary.mediumRisks++;
          }
        }

        summaries.push(summary);
      }

      // Get the AWS region from config
      const region = this.configService.get<string>('aws.region');

      return {
        summaries,
        region
      };
    } catch (error) {
      this.logger.error(`Error getting risk summary for workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  private generateRandomString(length: number): string {
    return randomBytes(length / 2).toString('hex');
  }

  async createWorkload(isTemp: boolean = false, lensAliasArn?: string): Promise<string> {
    const waClient = this.awsConfig.createWAClient();
    
    const now = new Date();
    const timestamp = now.toLocaleString('en-AU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }).replace(/[/,:]/g, '').replace(/\s/g, '_');
    const randomString = this.generateRandomString(10);

    const workloadName = isTemp
      ? `DO_NOT_DELETE_temp_IaCAnalyzer_${randomString}`
      : `IaCAnalyzer_${timestamp}_UTC_${randomString}`;

    // Always include wellarchitected lens
    const lenses = ['wellarchitected'];
    
    // Add the specified lens if it's different from wellarchitected
    if (lensAliasArn && lensAliasArn !== 'arn:aws:wellarchitected::aws:lens/wellarchitected') {
      lenses.push(lensAliasArn);
    }

    const command = new CreateWorkloadCommand({
      WorkloadName: workloadName,
      Description: isTemp ? 'Temporary workload for IaC Analyzer' : 'IaC Analyzer workload',
      Environment: 'PREPRODUCTION',
      ReviewOwner: 'IaC Analyzer',
      Lenses: lenses,
      NonAwsRegions: ['global'],
      Tags: {
        'WorkloadName': workloadName,
        'CreatedBy': 'IaCAnalyzer',
        'IsProtected': isTemp ? 'false' : 'true'
      }
    });

    try {
      const response = await waClient.send(command);
      return response.WorkloadId!;
    } catch (error) {
      this.logger.error(`Error creating workload: ${error}`);
      throw new Error(error);
    }
  }

  async associateLens(workloadId: string, lensAliasArn: string) {
    if (!lensAliasArn || lensAliasArn === 'wellarchitected' || lensAliasArn === 'arn:aws:wellarchitected::aws:lens/wellarchitected') {
      // wellarchitected lens is already associated by default
      return;
    }
    
    const waClient = this.awsConfig.createWAClient();
    const command = new AssociateLensesCommand({
      WorkloadId: workloadId,
      LensAliases: [lensAliasArn],
    });

    try {
      await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error associating lens ${lensAliasArn} with workload ${workloadId}:`, error);
      throw new Error(error);
    }
  }

  async deleteWorkload(workloadId: string): Promise<void> {
    const waClient = this.awsConfig.createWAClient();
    const command = new DeleteWorkloadCommand({
      WorkloadId: workloadId,
      ClientRequestToken: randomUUID()
    });

    try {
      await waClient.send(command);
    } catch (error) {
      this.logger.error(`Error deleting workload: ${error}`);
      throw new Error(error);
    }
  }
}