import { UseCase } from 'src/shared/core/application/use-cases/base';
import { JwtService, JwtToken } from '../services/jwt.service';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { UnauthorizedError } from 'src/shared/core/domain/errors/unauthorized.error';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenOutput {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh token use case with token rotation
 */
export class RefreshTokenUseCase
  implements UseCase<RefreshTokenInput, RefreshTokenOutput>
{
  constructor(
    private readonly jwtService: JwtService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    // Verify refresh token
    let payload;
    try {
      payload = this.jwtService.verify(input.refreshToken);
    } catch (error) {
      throw UnauthorizedError.invalidToken();
    }

    if (payload.type !== 'refresh') {
      throw UnauthorizedError.invalidToken();
    }

    // Check if token exists in repository (not revoked)
    const tokenExists = await this.refreshTokenRepository.exists(
      input.refreshToken,
    );
    if (!tokenExists) {
      throw UnauthorizedError.invalidToken();
    }

    // Find user
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw UnauthorizedError.invalidToken();
    }

    // Delete old refresh token (rotation)
    await this.refreshTokenRepository.deleteByToken(input.refreshToken);

    // Generate new tokens
    const newAccessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email.getValue(),
    );
    const newRefreshToken = this.jwtService.generateRefreshToken(
      user.id,
      user.email.getValue(),
    );

    // Save new refresh token
    await this.refreshTokenRepository.save(
      newRefreshToken.getValue(),
      user.id,
      newRefreshToken.getExpiresAt(),
    );

    return {
      accessToken: newAccessToken.getValue(),
      refreshToken: newRefreshToken.getValue(),
    };
  }
}


