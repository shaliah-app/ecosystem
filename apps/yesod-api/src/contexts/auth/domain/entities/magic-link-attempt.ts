import { z } from 'zod';

// Value object for email with validation
export class EmailAddress {
  public readonly value: string;

  private constructor(value: string) {
    this.value = value;
  }

  static create(email: string): EmailAddress {
    const trimmedEmail = email.trim();
    const schema = z.string().email();
    const result = schema.safeParse(trimmedEmail);
    if (!result.success) {
      throw new Error(`Invalid email format: ${email}`);
    }
    return new EmailAddress(trimmedEmail);
  }

  equals(other: EmailAddress): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

// Domain entity for magic link attempt
export class MagicLinkAttempt {
  private static idCounter = 1;

  private constructor(
    public readonly id: number,
    public readonly email: EmailAddress,
    public readonly attemptedAt: Date,
    public readonly ipAddress: string | undefined,
    public readonly success: boolean
  ) {}

  static create(params: {
    email: EmailAddress;
    attemptedAt?: Date;
    ipAddress?: string;
    success?: boolean;
  }): MagicLinkAttempt;
  static create(email: string, ipAddr: string | null, successFlag: boolean): MagicLinkAttempt;
  static create(
    paramsOrEmail: { email: EmailAddress; attemptedAt?: Date; ipAddress?: string; success?: boolean } | string,
    ipAddr?: string | null,
    successFlag?: boolean
  ): MagicLinkAttempt {
    // Handle old API
    if (typeof paramsOrEmail === 'string') {
      const email = paramsOrEmail;
      return MagicLinkAttempt.create({
        email: EmailAddress.create(email),
        ...(ipAddr && { ipAddress: ipAddr }),
        success: successFlag ?? true
      });
    }

    // Handle new API
    const params = paramsOrEmail;
    // Validate required fields
    if (!params.email) {
      throw new Error('Email is required');
    }
    if (params.attemptedAt === null) {
      throw new Error('AttemptedAt is required');
    }
    if (params.success === null) {
      throw new Error('Success is required');
    }

    // Validate IP address format if provided
    if (params.ipAddress) {
      const ipSchema = z.string().regex(/^(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/);
      const ipResult = ipSchema.safeParse(params.ipAddress);
      if (!ipResult.success) {
        throw new Error('Invalid IP address format');
      }
    }

    const email = params.email;
    const attemptedAt = params.attemptedAt || new Date();
    const ipAddress = params.ipAddress;
    const success = params.success !== undefined ? params.success : true;

    // Generate unique ID
    const id = this.idCounter++;

    return new MagicLinkAttempt(id, email, attemptedAt, ipAddress, success);
  }

  // Factory method for reconstructing from DB data
  static fromPersistence(
    id: number,
    email: string,
    attemptedAt: Date,
    ipAddress: string | null,
    success: boolean
  ): MagicLinkAttempt {
    const emailAddress = EmailAddress.create(email);
    return new MagicLinkAttempt(id, emailAddress, attemptedAt, ipAddress || undefined, success);
  }

  getEmail(): string {
    return this.email.value;
  }

  isWithinLastHour(currentTime: number = Date.now()): boolean {
    const oneHourAgo = new Date(currentTime - 60 * 60 * 1000);
    return this.attemptedAt >= oneHourAgo;
  }

  isWithinLastMinute(currentTime: number = Date.now()): boolean {
    const oneMinuteAgo = new Date(currentTime - 60 * 1000);
    return this.attemptedAt >= oneMinuteAgo;
  }
}