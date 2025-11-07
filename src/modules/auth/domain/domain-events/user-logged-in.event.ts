/**
 * Domain event: User logged in
 */
export class UserLoggedInEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly timestamp: Date = new Date(),
  ) {}
}


