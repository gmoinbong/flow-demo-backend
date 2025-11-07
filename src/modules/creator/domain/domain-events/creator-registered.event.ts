/**
 * Domain event: Creator registered
 */
export class CreatorRegisteredEvent {
  constructor(
    public readonly creatorId: string,
    public readonly userId: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

