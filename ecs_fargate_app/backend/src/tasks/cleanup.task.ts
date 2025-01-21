import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../shared/services/storage.service';

@Injectable()
export class CleanupTask {
  constructor(private readonly storageService: StorageService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCleanup() {
    await this.storageService.deleteExpiredFiles();
  }
}