import { IScraperJobRepository } from '../../domain/repositories/scraper-job.repository.interface';
import { ScraperJob } from '../../domain/entities/scraper-job.entity';
import { NotFoundError } from 'src/shared/core/domain/errors';

export interface ExecuteScraperJobCommand {
  jobId: string;
}

export class ExecuteScraperJobUseCase {
  constructor(
    private readonly jobRepository: IScraperJobRepository,
    // Will inject scraper service here
  ) {}

  async execute(command: ExecuteScraperJobCommand): Promise<ScraperJob> {
    const job = await this.jobRepository.findById(command.jobId);
    if (!job) {
      throw new NotFoundError('Scraper job not found');
    }

    if (!job.status.isPending()) {
      throw new Error('Job is not in pending status');
    }

    // Start job
    let updatedJob = job.start();
    updatedJob = await this.jobRepository.save(updatedJob);

    try {
      // Execute scraping (will be implemented with actual scraper service)
      // const resultData = await this.scraperService.execute(job);
      // updatedJob = updatedJob.complete(resultData);
      
      // Placeholder
      throw new Error('Scraper service not implemented yet');
    } catch (error) {
      updatedJob = updatedJob.fail(
        error instanceof Error ? error.message : 'Unknown error',
      );
    }

    return await this.jobRepository.save(updatedJob);
  }
}

