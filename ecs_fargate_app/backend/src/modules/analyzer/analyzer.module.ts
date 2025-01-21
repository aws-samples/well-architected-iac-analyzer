import { Module } from '@nestjs/common';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';
import { StorageService } from '../../shared/services/storage.service';
import { ConfigModule } from '@nestjs/config';
import storageConfig from '../../config/storage.config';
import { AnalyzerGateway } from './analyzer.gateway';
import { AwsConfigService } from '../../config/aws.config';

@Module({
  imports: [
    ConfigModule.forFeature(storageConfig),
  ],
  controllers: [AnalyzerController],
  providers: [AnalyzerService, AnalyzerGateway, AwsConfigService, StorageService],
  exports: [AnalyzerService, StorageService]
})
export class AnalyzerModule {}