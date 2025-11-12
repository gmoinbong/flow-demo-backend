import { Injectable, Inject } from '@nestjs/common';
import type { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { NotFoundError } from 'src/shared/core/domain/errors';
import { CREATOR_DI_TOKENS } from '../../creator.tokens';

@Injectable()
export class GetCreatorByIdUseCase {
  constructor(
    @Inject(CREATOR_DI_TOKENS.CREATOR_REPOSITORY)
    private readonly creatorRepository: ICreatorRepository,
  ) {}

  async execute(id: string): Promise<Creator> {
    const creator = await this.creatorRepository.findById(id);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }
    return creator;
  }
}

