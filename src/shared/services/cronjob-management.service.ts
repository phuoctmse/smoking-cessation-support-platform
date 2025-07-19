import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Injectable()
export class CronJobManagementService {
  private readonly logger = new Logger(CronJobManagementService.name);

  constructor(private schedulerRegistry: SchedulerRegistry) {}

  /**
   * Get all registered cron jobs
   */
  getCronJobs() {
    const jobs = this.schedulerRegistry.getCronJobs();
    const jobList: any[] = [];

    jobs.forEach((value, key) => {
      jobList.push({
        name: key,
        running: (value as any).running || false,
        lastDate: value.lastDate(),
        nextDate: value.nextDate(),
      });
    });

    return jobList;
  }

  /**
   * Stop a specific cron job
   */
  stopCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    void job.stop();
    this.logger.log(`⏹️ Stopped cron job: ${name}`);
  }

  /**
   * Start a specific cron job
   */
  startCronJob(name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    void job.start();
    this.logger.log(`▶️ Started cron job: ${name}`);
  }

  /**
   * Add a new cron job dynamically
   */
  addCronJob(name: string, cronTime: string, callback: () => void) {
    const job = new CronJob(cronTime, callback);
    this.schedulerRegistry.addCronJob(name, job);
    job.start();
    this.logger.log(`➕ Added and started cron job: ${name} with schedule: ${cronTime}`);
  }

  /**
   * Delete a cron job
   */
  deleteCronJob(name: string) {
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.log(`🗑️ Deleted cron job: ${name}`);
  }
}
