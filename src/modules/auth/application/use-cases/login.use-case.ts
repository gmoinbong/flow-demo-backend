import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Email } from '../../domain/value-objects/email.vo';
import { PasswordService } from '../services/password.service';
import { JwtService, JwtToken } from '../services/jwt.service';
import { RedisLockoutService } from '../services/redis-lockout.service';
import { IRefreshTokenRepository } from '../../infrastructure/persistence/refresh-token.repository';
import {
  UserNotFoundError,
  InvalidPasswordError,
  TooManyLoginAttemptsError,
} from '../../domain/errors/auth-errors';

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginOutput {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
}

/**
 * Login use case
 */
export class LoginUseCase implements UseCase<LoginInput, LoginOutput> {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
    private readonly lockoutService: RedisLockoutService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
  ) {}

  async execute(input: LoginInput): Promise<LoginOutput> {
    const email = Email.create(input.email);

    // Check lockout
    const lockoutStatus = await this.lockoutService.isLocked(email.getValue());
    if (lockoutStatus.locked) {
      throw new TooManyLoginAttemptsError(lockoutStatus.lockedUntil);
    }

    // Find user
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      await this.lockoutService.recordFailedAttempt(email.getValue());
      throw new UserNotFoundError(email.getValue());
    }

    // Check password
    if (!user.hasPassword()) {
      await this.lockoutService.recordFailedAttempt(email.getValue());
      throw new InvalidPasswordError();
    }

    const passwordMatch = await user.comparePassword(
      input.password,
      this.passwordService.compare.bind(this.passwordService),
    );

    if (!passwordMatch) {
      await this.lockoutService.recordFailedAttempt(email.getValue());
      throw new InvalidPasswordError();
    }

    // Clear lockout on success
    await this.lockoutService.clearLockout(email.getValue());

    // Generate tokens
    const refreshToken = this.jwtService.generateRefreshToken(
      user.id,
      user.email.getValue(),
    );
    const refreshJti = this.jwtService.getJti(refreshToken.getValue());
    
    if (!refreshJti) {
      throw new Error('Failed to generate refresh token jti');
    }

    // Save refresh token to Redis
    await this.refreshTokenRepository.save(
      refreshJti,
      user.id,
      refreshToken.getExpiresAt(),
    );

    const accessToken = this.jwtService.generateAccessToken(
      user.id,
      user.email.getValue(),
    );

    return {
      accessToken: accessToken.getValue(),
      refreshToken: refreshToken.getValue(),
      user: {
        id: user.id,
        email: user.email.getValue(),
      },
    };
  }
}


