import { Injectable } from '@nestjs/common';

/**
 * Creator validator service
 */
@Injectable()
export class CreatorValidatorService {
  /**
   * Validate display name
   */
  validateDisplayName(displayName: string | null): boolean {
    if (!displayName) {
      return true; // Optional field
    }
    return displayName.length >= 2 && displayName.length <= 100;
  }

  /**
   * Validate bio
   */
  validateBio(bio: string | null): boolean {
    if (!bio) {
      return true; // Optional field
    }
    return bio.length <= 1000;
  }

  /**
   * Validate avatar URL
   */
  validateAvatarUrl(avatarUrl: string | null): boolean {
    if (!avatarUrl) {
      return true; // Optional field
    }
    try {
      new URL(avatarUrl);
      return true;
    } catch {
      return false;
    }
  }
}

