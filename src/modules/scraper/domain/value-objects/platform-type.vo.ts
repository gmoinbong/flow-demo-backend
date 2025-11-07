/**
 * Platform type value object
 */
export enum PlatformType {
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  INSTAGRAM = 'instagram',
}

export class PlatformTypeVO {
  private constructor(public readonly value: PlatformType) {}

  static create(type: string): PlatformTypeVO {
    const validType = Object.values(PlatformType).find(
      (t) => t === type.toLowerCase(),
    );
    if (!validType) {
      throw new Error(`Invalid platform type: ${type}`);
    }
    return new PlatformTypeVO(validType);
  }

  static youtube(): PlatformTypeVO {
    return new PlatformTypeVO(PlatformType.YOUTUBE);
  }

  static tiktok(): PlatformTypeVO {
    return new PlatformTypeVO(PlatformType.TIKTOK);
  }

  static instagram(): PlatformTypeVO {
    return new PlatformTypeVO(PlatformType.INSTAGRAM);
  }
}

