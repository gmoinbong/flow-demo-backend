/**
 * Campaign allocation status value object
 */
export enum AllocationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DECLINED = 'declined',
}

export class AllocationStatusVO {
  private constructor(public readonly value: AllocationStatus) {}

  static create(status: string): AllocationStatusVO {
    const validStatus = Object.values(AllocationStatus).find(
      (s) => s === status.toLowerCase(),
    );
    if (!validStatus) {
      throw new Error(`Invalid allocation status: ${status}`);
    }
    return new AllocationStatusVO(validStatus);
  }

  static pending(): AllocationStatusVO {
    return new AllocationStatusVO(AllocationStatus.PENDING);
  }

  static accepted(): AllocationStatusVO {
    return new AllocationStatusVO(AllocationStatus.ACCEPTED);
  }

  static active(): AllocationStatusVO {
    return new AllocationStatusVO(AllocationStatus.ACTIVE);
  }

  static completed(): AllocationStatusVO {
    return new AllocationStatusVO(AllocationStatus.COMPLETED);
  }

  static declined(): AllocationStatusVO {
    return new AllocationStatusVO(AllocationStatus.DECLINED);
  }

  isActive(): boolean {
    return this.value === AllocationStatus.ACTIVE;
  }

  canCollectMetrics(): boolean {
    return (
      this.value === AllocationStatus.ACCEPTED ||
      this.value === AllocationStatus.ACTIVE
    );
  }
}

