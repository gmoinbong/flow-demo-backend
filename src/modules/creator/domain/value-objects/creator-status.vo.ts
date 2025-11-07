/**
 * Creator status value object
 */
export enum CreatorStatus {
  ACTIVE = 'active',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export class CreatorStatusVO {
  private constructor(public readonly value: CreatorStatus) {}

  static create(status: string): CreatorStatusVO {
    const validStatus = Object.values(CreatorStatus).find(
      (s) => s === status.toLowerCase(),
    );
    if (!validStatus) {
      throw new Error(`Invalid creator status: ${status}`);
    }
    return new CreatorStatusVO(validStatus);
  }

  static active(): CreatorStatusVO {
    return new CreatorStatusVO(CreatorStatus.ACTIVE);
  }

  static pending(): CreatorStatusVO {
    return new CreatorStatusVO(CreatorStatus.PENDING);
  }

  static suspended(): CreatorStatusVO {
    return new CreatorStatusVO(CreatorStatus.SUSPENDED);
  }

  isActive(): boolean {
    return this.value === CreatorStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.value === CreatorStatus.PENDING;
  }

  isSuspended(): boolean {
    return this.value === CreatorStatus.SUSPENDED;
  }
}

