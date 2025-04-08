import { 
    Controller, 
    Post, 
    Body, 
    HttpException, 
    HttpStatus,
    Logger 
  } from '@nestjs/common';
  import { ReportService } from './report.service';
  import { GenerateReportDto } from '../../shared/dto/analysis.dto';
  
  @Controller('report')
  export class ReportController {
    private readonly logger = new Logger(ReportController.name);
  
    constructor(private readonly reportService: ReportService) {}
  
    @Post('generate')
    async generateReport(@Body() generateReportDto: GenerateReportDto) {
      try {
        return await this.reportService.generateReport(generateReportDto.workloadId, generateReportDto.lensAliasArn);
      } catch (error) {
        this.logger.error('Failed to generate report:', error);
        throw new HttpException(
          `Failed to generate report: ${error.message || error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  
    @Post('recommendations')
    async generateRecommendations(@Body() results: any[]) {
      try {
        return this.reportService.generateRecommendationsCsv(results);
      } catch (error) {
        this.logger.error('Failed to generate recommendations:', error);
        throw new HttpException(
          `Failed to generate recommendations: ${error.message || error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }