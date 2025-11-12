import { Injectable, Inject } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';

export interface GetCreatorsCommand {
  limit?: number;
  offset?: number;
  status?: string;
}

export interface GetCreatorsResult {
  creators: Creator[];
  total: number;
  limit: number;
  offset: number;
}

@Injectable()
export class GetCreatorsUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
  ) {}

  async execute(command: GetCreatorsCommand): Promise<GetCreatorsResult> {
    const limit = command.limit || 20;
    const offset = command.offset || 0;

    let creators: Creator[];
    
    if (command.status) {
      creators = await this.creatorRepository.findByStatus(
        command.status,
        limit,
        offset,
      );
    } else {
      creators = await this.creatorRepository.findAll(limit, offset);
    }

    // For MVP, return creators with total count
    // In production, you might want to add a count method to repository
    return {
      creators,
      total: creators.length, // Simplified - should query count separately
      limit,
      offset,
    };
  }
}

