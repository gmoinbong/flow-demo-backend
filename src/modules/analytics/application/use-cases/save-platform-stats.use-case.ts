import { IPlatformStatsRepository } from '../../domain/repositories/platform-stats.repository.interface';
import { PlatformStats } from '../../domain/entities/platform-stats.entity';

export class SavePlatformStatsUseCase {
  constructor(private readonly statsRepository: IPlatformStatsRepository) {}

  async execute(stats: PlatformStats): Promise<PlatformStats> {
    return await this.statsRepository.save(stats);
  }
}

