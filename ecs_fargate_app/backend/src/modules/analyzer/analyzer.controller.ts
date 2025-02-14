import {
    Controller,
    Post,
    Body,
    HttpException,
    HttpStatus,
    Logger,
    UseInterceptors,
    UploadedFile, BadRequestException
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import * as path from 'path';
import {StorageService} from '../../shared/services/storage.service';
import {FileUploadResponseDto} from '../../shared/dto/file-upload.dto';
import {AnalyzerService} from './analyzer.service';
import {AnalyzeRequestDto, IaCTemplateType} from '../../shared/dto/analysis.dto';
import {diskStorage} from "multer";
import {v4 as uuidv4} from "uuid";
import * as fs from 'fs';

@Controller('analyzer')
export class AnalyzerController {
    private readonly logger = new Logger(AnalyzerController.name);

    constructor(
        private readonly analyzerService: AnalyzerService,
        private readonly storageService: StorageService
    ) {
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        limits: {
            fileSize: 10 * 1024 * 1024, // 10MB limit
        },
        storage: diskStorage({
            destination: './temp-uploads',
            filename: (req, file, cb) => {
                const fileId = uuidv4();
                const extension = path.extname(file.originalname);
                cb(null, `${fileId}${extension}`);
            },
        }),
    }))
    async uploadFile(@UploadedFile() file: Express.Multer.File): Promise<FileUploadResponseDto> {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate JSON content if file is JSON
        if (file.mimetype === 'application/json') {
            try {
                const content = await fs.promises.readFile(file.path, 'utf8');
                JSON.parse(content); // Validate JSON structure
            } catch (error) {
                throw new BadRequestException('Invalid JSON file format');
            }
        }

        const fileContentBuffer = await fs.promises.readFile(file.path);
        const fileName = await this.storageService.uploadFile(fileContentBuffer, file.filename);

        return {
            fileName: fileName,
        };
    }

    @Post('analyze')
    async analyze(@Body() analyzeRequest: AnalyzeRequestDto) {
        try {
            return await this.analyzerService.analyze(
                analyzeRequest.fileName,
                analyzeRequest.workloadId,
                analyzeRequest.selectedPillars,
                analyzeRequest.fileType
            );
        } catch (error) {
            this.logger.error('Analysis failed:', error);
            throw new HttpException(
                `Failed to analyze template: ${error.message || error}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('generate-iac')
    async generateIacDocument(@Body() body: {
        fileName: string;
        fileType: string;
        recommendations: any[];
        templateType: IaCTemplateType;
    }) {
        try {
            const result = await this.analyzerService.generateIacDocument(
                body.fileName,
                body.fileType,
                body.recommendations,
                body.templateType
            );
            return result;
        } catch (error) {
            this.logger.error('IaC generation failed:', error);
            return {
                content: '',
                isCancelled: false,
                error: error instanceof Error ? error.message : 'Failed to generate IaC document'
            };
        }
    }

    @Post('get-more-details')
    async getMoreDetails(@Body() body: {
        selectedItems: any[];
        fileName: string;
        fileType: string;
        templateType?: IaCTemplateType;
    }) {
        try {
            const result = await this.analyzerService.getMoreDetails(
                body.selectedItems,
                body.fileName,
                body.fileType,
                body.templateType
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
        return {message: 'Generation cancelled successfully'};
    }

    @Post('cancel-analysis')
    async cancelAnalysis() {
        try {
            this.analyzerService.cancelAnalysis();
            return {message: 'Analysis cancelled'};
        } catch (error) {
            this.logger.error('Failed to cancel analysis:', error);
            throw new HttpException(
                `Failed to cancel analysis: ${error.message || error}`,
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}
