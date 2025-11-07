/**
 * Domain event: Creator linked to brand
 */
export class CreatorBrandLinkedEvent {
  constructor(
    public readonly relationshipId: string,
    public readonly creatorId: string,
    public readonly brandId: string,
    public readonly role: string,
    public readonly occurredAt: Date = new Date(),
  ) {}
}

