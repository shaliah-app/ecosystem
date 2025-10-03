import { describe, it, expect } from 'vitest';
import { MagicLinkAttempt, EmailAddress } from '../../../src/contexts/auth/domain/entities/magic-link-attempt';

describe('MagicLinkAttempt Domain Entity', () => {
  describe('EmailAddress Value Object', () => {
    it('should create valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user@subdomain.domain.com'
      ];

      validEmails.forEach(email => {
        const emailAddress = EmailAddress.create(email);
        expect(emailAddress.value).toBe(email);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'invalid',
        '@example.com',
        'user@',
        'user.example.com',
        'user@.com',
        'user..user@example.com',
        ''
      ];

      invalidEmails.forEach(email => {
        expect(() => EmailAddress.create(email)).toThrow('Invalid email format');
      });
    });

    it('should handle edge cases', () => {
      // Test case sensitivity
      const email1 = EmailAddress.create('User@Example.Com');
      const email2 = EmailAddress.create('user@example.com');
      expect(email1.value).toBe('User@Example.Com');
      expect(email2.value).toBe('user@example.com');

      // Test trimming
      const trimmed = EmailAddress.create('  user@example.com  ');
      expect(trimmed.value).toBe('user@example.com');
    });
  });

  describe('MagicLinkAttempt Entity', () => {
    const validEmail = EmailAddress.create('test@example.com');
    const validIp = '192.168.1.1';
    const validTimestamp = new Date('2025-01-01T12:00:00Z');

    it('should create a MagicLinkAttempt with valid data', () => {
      const attempt = MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: validTimestamp,
        ipAddress: validIp,
        success: true
      });

      expect(attempt.id).toBeDefined();
      expect(attempt.email.value).toBe('test@example.com');
      expect(attempt.attemptedAt).toEqual(validTimestamp);
      expect(attempt.ipAddress).toBe(validIp);
      expect(attempt.success).toBe(true);
    });

    it('should create a MagicLinkAttempt without IP address', () => {
      const attempt = MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: validTimestamp,
        success: false
      });

      expect(attempt.ipAddress).toBeUndefined();
      expect(attempt.success).toBe(false);
    });

    it('should validate required fields', () => {
      expect(() => MagicLinkAttempt.create({
        email: null as any,
        attemptedAt: validTimestamp,
        success: true
      })).toThrow('Email is required');

      expect(() => MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: null as any,
        success: true
      })).toThrow('AttemptedAt is required');

      expect(() => MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: validTimestamp,
        success: null as any
      })).toThrow('Success is required');
    });

    it('should validate IP address format', () => {
      const invalidIps = ['invalid', '256.256.256.256', '192.168.1.1.1'];

      invalidIps.forEach(ip => {
        expect(() => MagicLinkAttempt.create({
          email: validEmail,
          attemptedAt: validTimestamp,
          ipAddress: ip,
          success: true
        })).toThrow('Invalid IP address format');
      });
    });

    it('should generate unique IDs for each instance', () => {
      const attempt1 = MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: validTimestamp,
        success: true
      });

      const attempt2 = MagicLinkAttempt.create({
        email: validEmail,
        attemptedAt: validTimestamp,
        success: true
      });

      expect(attempt1.id).not.toBe(attempt2.id);
    });
  });
});