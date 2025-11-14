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

    // Extract jti from token
    const jti = payload.jti;
    if (!jti) {
      throw UnauthorizedError.invalidToken();
    }

    // Check if token exists in repository (not revoked)
    const tokenExists = await this.refreshTokenRepository.exists(jti);
    if (!tokenExists) {
      throw UnauthorizedError.invalidToken();
    }

    // Find user
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw UnauthorizedError.invalidToken();
    }

    // Delete old refresh token (rotation)
    await this.refreshTokenRepository.deleteByJti(jti);

    // Generate new tokens
    const newRefreshToken = this.jwtService.generateRefreshToken(
      user.id,
      user.email.getValue(),
    );
    const newRefreshJti = this.jwtService.getJti(newRefreshToken.getValue());
    
    if (!newRefreshJti) {
      throw new Error('Failed to generate refresh token jti');
    }

    // Save new refresh token
    await this.refreshTokenRepository.save(
      newRefreshJti,
      user.id,
      newRefreshToken.getExpiresAt(),
    );

    const newAccessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email.getValue(),
    );

    return {
      accessToken: newAccessToken.getValue(),
      refreshToken: newRefreshToken.getValue(),
    };
  }
}


