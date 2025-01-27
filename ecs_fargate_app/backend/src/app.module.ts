import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {ScheduleModule} from '@nestjs/schedule';
import {AnalyzerModule} from './modules/analyzer/analyzer.module';
import {WellArchitectedModule} from './modules/well-architected/well-architected.module';
import {ReportModule} from './modules/report/report.module';
import { AuthModule } from './modules/auth/auth.module';
import configuration from './config/configuration';
import {CleanupTask} from './tasks/cleanup.task';
import storageConfig from './config/storage.config';
import {StorageService} from "./shared/services/storage.service";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    AnalyzerModule,
    WellArchitectedModule,
    ReportModule,
    AuthModule,
    ScheduleModule.forRoot(),
  ],
  providers: [CleanupTask, StorageService],
})
export class AppModule {
}