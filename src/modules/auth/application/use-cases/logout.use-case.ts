import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';

export interface LogoutInput {
  refreshToken: string;
}

export interface LogoutOutput {
  success: boolean;
}

/**
 * Logout use case
 */
export class LogoutUseCase implements UseCase<LogoutInput, LogoutOutput> {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    await this.refreshTokenRepository.deleteByToken(input.refreshToken);
    return { success: true };
  }
}


