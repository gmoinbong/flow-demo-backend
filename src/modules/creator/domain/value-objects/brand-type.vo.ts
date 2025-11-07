/**
 * Brand type value object
 */
export enum BrandType {
  AGENCY = 'agency',
  DIRECT = 'direct',
  PLATFORM = 'platform',
}

export class BrandTypeVO {
  private constructor(public readonly value: BrandType) {}

  static create(type: string): BrandTypeVO {
    const validType = Object.values(BrandType).find(
      (t) => t === type.toLowerCase(),
    );
    if (!validType) {
      throw new Error(`Invalid brand type: ${type}`);
    }
    return new BrandTypeVO(validType);
  }

  static agency(): BrandTypeVO {
    return new BrandTypeVO(BrandType.AGENCY);
  }

  static direct(): BrandTypeVO {
    return new BrandTypeVO(BrandType.DIRECT);
  }

  static platform(): BrandTypeVO {
    return new BrandTypeVO(BrandType.PLATFORM);
  }
}

