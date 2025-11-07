import { UseCase } from 'src/shared/core/application/use-cases/base';
import { IResetTokenRepository } from '../../infrastructure/persistence/reset-token.repository';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { Password } from '../../domain/value-objects/password.vo';
import { PasswordService } from '../services/password.service';
import { InvalidResetTokenError, UserNotFoundError } from '../../domain/errors/auth-errors';

export interface ResetPasswordInput {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordOutput {
  success: boolean;
}

/**
 * Reset password use case
 */
export class ResetPasswordUseCase
  implements UseCase<ResetPasswordInput, ResetPasswordOutput>
{
  constructor(
    private readonly resetTokenRepository: IResetTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly passwordService: PasswordService,
  ) {}

  async execute(input: ResetPasswordInput): Promise<ResetPasswordOutput> {
    // Verify reset token
    const tokenData = await this.resetTokenRepository.get(input.resetToken);
    if (!tokenData) {
      throw new InvalidResetTokenError();
    }

    // Check expiration
    if (new Date(tokenData.expiresAt) < new Date()) {
      await this.resetTokenRepository.delete(input.resetToken);
      throw new InvalidResetTokenError();
    }

    // Find user
    const user = await this.userRepository.findById(tokenData.userId);
    if (!user) {
      throw new UserNotFoundError();
    }

    // Hash new password
    const passwordHash = await this.passwordService.hash(input.newPassword);
    const password = Password.fromHash(passwordHash);

    // Update user password
    const updatedUser = user.updatePassword(password);
    await this.userRepository.save(updatedUser);

    // Delete reset token (one-time use)
    await this.resetTokenRepository.delete(input.resetToken);

    return { success: true };
  }
}


