import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';
import { JwtService } from '../services/jwt.service';
import { UnauthorizedError } from 'src/shared/core/domain/errors/unauthorized.error';

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
    private readonly jwtService: JwtService,
  ) {}

  async execute(input: LogoutInput): Promise<LogoutOutput> {
    // Extract jti from token
    let payload;
    try {
      payload = this.jwtService.verify(input.refreshToken);
    } catch (error) {
      // If token is invalid, consider logout successful (idempotent)
      return { success: true };
    }

    const jti = payload.jti;
    if (jti) {
      await this.refreshTokenRepository.deleteByJti(jti);
    }

    return { success: true };
  }
}


