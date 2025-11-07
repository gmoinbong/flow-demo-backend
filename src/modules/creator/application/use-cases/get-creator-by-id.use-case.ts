import { ICreatorRepository } from '../../domain/repositories/creator.repository.interface';
import { Creator } from '../../domain/entities/creator.entity';
import { NotFoundError } from 'src/shared/core/domain/errors';

export class GetCreatorByIdUseCase {
  constructor(private readonly creatorRepository: ICreatorRepository) {}

  async execute(id: string): Promise<Creator> {
    const creator = await this.creatorRepository.findById(id);
    if (!creator) {
      throw new NotFoundError('Creator not found');
    }
    return creator;
  }
}

