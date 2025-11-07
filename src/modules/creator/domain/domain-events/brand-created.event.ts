/**
 * Domain event: Brand created
 */
export class BrandCreatedEvent {
  constructor(
    public readonly brandId: string,
    public readonly name: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

