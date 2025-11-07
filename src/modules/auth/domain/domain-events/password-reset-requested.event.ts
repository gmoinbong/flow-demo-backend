/**
 * Domain event: Password reset requested
 */
export class PasswordResetRequestedEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly resetToken: string,
    public readonly expiresAt: Date,
    public readonly timestamp: Date = new Date(),
  ) {}
}


