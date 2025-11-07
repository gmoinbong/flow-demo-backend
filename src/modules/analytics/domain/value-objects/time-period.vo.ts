/**
 * Time period value object
 */
export enum TimePeriod {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
}

export class TimePeriodVO {
  private constructor(public readonly value: TimePeriod) {}

  static create(period: string): TimePeriodVO {
    const validPeriod = Object.values(TimePeriod).find(
      (p) => p === period.toLowerCase(),
    );
    if (!validPeriod) {
      throw new Error(`Invalid time period: ${period}`);
    }
    return new TimePeriodVO(validPeriod);
  }

  static daily(): TimePeriodVO {
    return new TimePeriodVO(TimePeriod.DAILY);
  }

  static weekly(): TimePeriodVO {
    return new TimePeriodVO(TimePeriod.WEEKLY);
  }

  static monthly(): TimePeriodVO {
    return new TimePeriodVO(TimePeriod.MONTHLY);
  }

  static yearly(): TimePeriodVO {
    return new TimePeriodVO(TimePeriod.YEARLY);
  }
}

