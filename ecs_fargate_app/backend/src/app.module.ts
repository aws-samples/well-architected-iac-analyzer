import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AnalyzerModule } from './modules/analyzer/analyzer.module';
import { WellArchitectedModule } from './modules/well-architected/well-architected.module';
import { ReportModule } from './modules/report/report.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AnalyzerModule,
    WellArchitectedModule,
    ReportModule,
  ],
})
export class AppModule {}