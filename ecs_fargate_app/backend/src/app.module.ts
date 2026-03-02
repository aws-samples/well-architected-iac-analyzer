import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AnalyzerModule } from './modules/analyzer/analyzer.module';
import { WellArchitectedModule } from './modules/well-architected/well-architected.module';
import { ReportModule } from './modules/report/report.module';
import { AuthModule } from './modules/auth/auth.module';
import { StorageModule } from './modules/storage/storage.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // Global request-rate configuration.
    // Uses in-memory storage — suitable for single-task deployments.
    // For multi-task ECS services, replace with a shared store (e.g. Redis).
    ThrottlerModule.forRoot([
      {
        ttl: 60000,   // 60-second window
        limit: 100,   // requests per window per source
      },
    ]),
    AnalyzerModule,
    WellArchitectedModule,
    ReportModule,
    AuthModule,
    StorageModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}