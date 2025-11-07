import { IScraperJobRepository } from '../../domain/repositories/scraper-job.repository.interface';
import { ScraperJob } from '../../domain/entities/scraper-job.entity';
import { PlatformTypeVO } from '../../domain/value-objects/platform-type.vo';

export interface CreateScraperJobCommand {
  socialAccountId: string;
  provider: string;
  platform: string;
  maxRetries?: number;
  priority?: number;
}

export class CreateScraperJobUseCase {
  constructor(private readonly jobRepository: IScraperJobRepository) {}

  async execute(command: CreateScraperJobCommand): Promise<ScraperJob> {
    const job = ScraperJob.create(
      crypto.randomUUID(),
      command.socialAccountId,
      command.provider,
      PlatformTypeVO.create(command.platform),
      command.maxRetries || 3,
      command.priority || 0,
    );

    return await this.jobRepository.save(job);
  }
}

