import { z } from 'zod';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Email value object with validation
 */
export class Email {
  private constructor(private readonly value: string) {
    if (!EMAIL_REGEX.test(value)) {
      throw new Error('Invalid email format');
    }
  }

  static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  static validate(email: string): boolean {
    return EMAIL_REGEX.test(email.toLowerCase().trim());
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

export const EmailSchema = z.string().email().transform((val) => Email.create(val));


