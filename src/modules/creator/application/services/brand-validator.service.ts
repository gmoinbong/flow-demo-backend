/**
 * Brand validator service
 */
export class BrandValidatorService {
  /**
   * Validate brand name
   */
  validateName(name: string): boolean {
    return name.length >= 2 && name.length <= 100;
  }

  /**
   * Validate description
   */
  validateDescription(description: string | null): boolean {
    if (!description) {
      return true; // Optional field
    }
    return description.length <= 2000;
  }

  /**
   * Validate website URL
   */
  validateWebsiteUrl(websiteUrl: string | null): boolean {
    if (!websiteUrl) {
      return true; // Optional field
    }
    try {
      const url = new URL(websiteUrl);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * Validate logo URL
   */
  validateLogoUrl(logoUrl: string | null): boolean {
    if (!logoUrl) {
      return true; // Optional field
    }
    try {
      new URL(logoUrl);
      return true;
    } catch {
      return false;
    }
  }
}

