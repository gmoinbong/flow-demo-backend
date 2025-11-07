import { createHmac, timingSafeEqual } from 'crypto';

/**
 * OAuth state service - signs and validates OAuth state tokens for CSRF protection
 * Uses HMAC-SHA256 to sign state tokens without requiring Redis storage
 */
export class OAuthStateService {
  constructor(private readonly secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('OAuth state secret must be at least 32 characters');
    }
  }

  /**
   * Sign state token with HMAC
   * Returns: state.signature
   */
  signState(state: string): string {
    const hmac = createHmac('sha256', this.secret);
    hmac.update(state);
    const signature = hmac.digest('hex');
    return `${state}.${signature}`;
  }

  /**
   * Validate signed state token
   * Returns the original state if valid, null otherwise
   */
  validateState(signedState: string): string | null {
    const parts = signedState.split('.');
    if (parts.length !== 2) {
      return null;
    }

    const [state, signature] = parts;

    // Recreate signature
    const hmac = createHmac('sha256', this.secret);
    hmac.update(state);
    const expectedSignature = hmac.digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    if (signature.length !== expectedSignature.length) {
      return null;
    }

    try {
      const signatureBuffer = Buffer.from(signature, 'hex');
      const expectedBuffer = Buffer.from(expectedSignature, 'hex');
      if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
        return null;
      }
      return state;
    } catch {
      return null;
    }
  }
}



