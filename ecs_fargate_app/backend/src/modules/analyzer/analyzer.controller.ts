import {
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { AnalyzerService } from './analyzer.service';
import { StorageService } from '../storage/storage.service';
import { AnalyzeRequestDto, IaCTemplateType } from '../../shared/dto/analysis.dto';
import { ConfigService } from '@nestjs/config';

@Controller('analyzer')
export class AnalyzerController {
  private readonly logger = new Logger(AnalyzerController.name);

  constructor(
    private readonly analyzerService: AnalyzerService,
    private readonly storageService: StorageService,
    private readonly configService: ConfigService,
  ) { }

  private getUserEmail(userDataHeader: string): string | null {
    // Check if authentication is enabled
    const isAuthEnabled = this.configService.get<boolean>('auth.enabled', false);

    if (!isAuthEnabled) {
      // Return default "iac-analyzer" email when auth is disabled
      return 'iac-analyzer';
    }

    // Check if in development mode
    const isDevMode = this.configService.get<boolean>('auth.devMode', false);
    const devEmail = this.configService.get<string>('auth.devEmail');

    if (isDevMode && devEmail) {
      this.logger.debug('Using development mode email:', devEmail);
      return devEmail;
    }

    // Production mode - parse from header
    if (!userDataHeader) {
      return null;
    }

    try {
      const payload = JSON.parse(
        Buffer.from(userDataHeader.split('.')[1], 'base64').toString()
      );
      return payload.email || null;
    } catch (error) {
      this.logger.error('Error parsing user data header:', error);
      return null;
    }
  }

  @Post('analyze')
  async analyze(
    @Body() analyzeRequest: AnalyzeRequestDto,
    @Headers('x-amzn-oidc-data') userDataHeader: string,
  ) {
    try {
      const email = this.getUserEmail(userDataHeader);
      const userId = email ? this.storageService.createUserIdHash(email) : null;
      const lensAlias = analyzeRequest.lensAliasArn?.split('/')?.pop();

      // If workloadId is provided, mark it as protected in the workloadIds map
      let workloadIds: Record<string, { id: string; protected: boolean; lastUpdated?: string }> | undefined;
      if (analyzeRequest.workloadId && lensAlias && !analyzeRequest.isTempWorkload) {
        workloadIds = {
          [lensAlias]: {
            id: analyzeRequest.workloadId,
            protected: true, // Provided by user, so it's protected
            lastUpdated: new Date().toISOString()
          }
        };
      }

      // If we have a workitem, update it with the workloadIds map
      if (userId) {
        try {
          const workItem = await this.storageService.getWorkItem(userId, analyzeRequest.fileId);
          if (workItem && workloadIds) {
            // Merge with existing workloadIds if present
            if (workItem.workloadIds) {
              workloadIds = { ...workItem.workloadIds, ...workloadIds };
            }
            
            await this.storageService.updateWorkItem(userId, analyzeRequest.fileId, {
              workloadIds,
              lastModified: new Date().toISOString(),
            });
          }
        } catch (error) {
          this.logger.warn(`Failed to update work item with workloadId: ${error.message}`);
        }
      }

      return await this.analyzerService.analyze(
        analyzeRequest.fileId,
        analyzeRequest.workloadId,
        analyzeRequest.selectedPillars,
        analyzeRequest.uploadMode,
        userId,
        analyzeRequest.supportingDocumentId,
        analyzeRequest.supportingDocumentDescription,
        lensAlias,
        analyzeRequest.lensAliasArn,
        analyzeRequest.lensName,
        analyzeRequest.lensPillars,
        analyzeRequest.outputLanguage // Pass the output language parameter
      );
    } catch (error) {
      this.logger.error('Analysis failed:', error);
      throw new HttpException(
        `Failed to analyze template: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-iac')
  async generateIacDocument(
    @Body() body: {
      fileId: string;
      recommendations: any[];
      templateType: IaCTemplateType;
      lensAliasArn?: string;
      lensName?: string;
    },
    @Headers('x-amzn-oidc-data') userDataHeader: string,
  ) {
    try {
      const email = this.getUserEmail(userDataHeader);
      const userId = email ? this.storageService.createUserIdHash(email) : null;
      const lensAlias = body.lensAliasArn?.split('/')?.pop() || body.lensAliasArn;

      const result = await this.analyzerService.generateIacDocument(
        body.fileId,
        body.recommendations,
        body.templateType,
        userId,
        lensAlias,
        body.lensName
      );
      return result;
    } catch (error) {
      this.logger.error('IaC generation failed:', error);
      return {
        content: '',
        isCancelled: false,
        error:
          error instanceof Error ? error.message : 'Failed to generate IaC document',
      };
    }
  }

  @Post('get-more-details')
  async getMoreDetails(@Body() body: {
    selectedItems: any[];
    fileId: string;
    templateType?: IaCTemplateType;
    lensAliasArn?: string;
    lensName?: string;
  },
    @Headers('x-amzn-oidc-data') userDataHeader: string,) {
    try {
      const email = this.getUserEmail(userDataHeader);
      const userId = email ? this.storageService.createUserIdHash(email) : null;
      const lensAlias = body.lensAliasArn?.split('/')?.pop() || body.lensAliasArn;

      const result = await this.analyzerService.getMoreDetails(
        body.selectedItems,
        userId,
        body.fileId,
        body.templateType,
        lensAlias,
        body.lensName
      );
      return result;
    } catch (error) {
      this.logger.error('Getting more details failed:', error);
      return {
        content: '',
        error: error instanceof Error ? error.message : 'Failed to get detailed analysis'
      };
    }
  }

  @Post('cancel-iac-generation')
  async cancelIaCGeneration() {
    this.analyzerService.cancelIaCGeneration();
    return { message: 'Generation cancelled successfully' };
  }

  @Post('cancel-analysis')
  async cancelAnalysis() {
    try {
      this.analyzerService.cancelAnalysis();
      return { message: 'Analysis cancelled' };
    } catch (error) {
      this.logger.error('Failed to cancel analysis:', error);
      throw new HttpException(
        `Failed to cancel analysis: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('chat')
  async chat(
    @Body() body: { fileId: string; message: string, lensName?: string, lensAliasArn?: string },
    @Headers('x-amzn-oidc-data') userDataHeader: string,
  ) {
    try {
      const email = this.getUserEmail(userDataHeader);
      const userId = email ? this.storageService.createUserIdHash(email) : null;
      const lensAlias = body.lensAliasArn?.split('/')?.pop() || 'wellarchitected';

      if (!userId) {
        throw new HttpException('User not authenticated', HttpStatus.UNAUTHORIZED);
      }

      const result = await this.analyzerService.chat(
        body.fileId,
        body.message,
        userId,
        body.lensName,
        lensAlias
      );

      return { content: result };
    } catch (error) {
      this.logger.error('Chat processing failed:', error);
      throw new HttpException(
        `Failed to process chat message: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}