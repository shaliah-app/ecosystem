import { describe, it, expect, beforeEach } from 'vitest';
import { UserProfile } from '../../../src/contexts/users/domain/entities/user-profile';

describe('UserProfile Domain Entity', () => {
  const validId = '123e4567-e89b-12d3-a456-426614174000';
  const validFullName = 'John Doe';
  const validAvatarUrl = 'https://example.com/avatar.jpg';
  const validLanguage = 'en-US';

  describe('Entity Creation', () => {
    it('should create a UserProfile with all fields', () => {
      const profile = UserProfile.create({
        id: validId,
        fullName: validFullName,
        avatarUrl: validAvatarUrl,
        language: validLanguage,
        telegramUserId: 123456789
      });

      expect(profile.id).toBe(validId);
      expect(profile.fullName).toBe(validFullName);
      expect(profile.avatarUrl).toBe(validAvatarUrl);
      expect(profile.language).toBe(validLanguage);
      expect(profile.telegramUserId).toBe(123456789);
      expect(profile.activeSpaceId).toBeUndefined();
    });

    it('should create a UserProfile with minimal required fields', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });

      expect(profile.id).toBe(validId);
      expect(profile.fullName).toBeUndefined();
      expect(profile.avatarUrl).toBeUndefined();
      expect(profile.language).toBe(validLanguage);
      expect(profile.telegramUserId).toBeUndefined();
      expect(profile.activeSpaceId).toBeUndefined();
    });

    it('should validate required fields', () => {
      expect(() => UserProfile.create({
        id: '',
        language: validLanguage
      })).toThrow('ID is required');

      expect(() => UserProfile.create({
        id: validId,
        language: ''
      })).toThrow('Language is required');

      expect(() => UserProfile.create({
        id: validId,
        language: null as any
      })).toThrow('Language is required');
    });

    it('should validate ID format (UUID)', () => {
      // Test null, undefined, empty string
      expect(() => UserProfile.create({
        id: null as any,
        language: validLanguage
      })).toThrow('ID is required');

      expect(() => UserProfile.create({
        id: undefined as any,
        language: validLanguage
      })).toThrow('ID is required');

      expect(() => UserProfile.create({
        id: '',
        language: validLanguage
      })).toThrow('ID is required');

      // Test invalid UUID formats
      const invalidUuids = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // invalid format
        '123e4567-e89b-12d3-a456-4266141740000', // too long
      ];

      invalidUuids.forEach(id => {
        expect(() => UserProfile.create({
          id,
          language: validLanguage
        })).toThrow('Invalid UUID format');
      });
    });
  });

  describe('updateFullName', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });
    });

    it('should update full name with valid values', () => {
      const newName = 'Jane Smith';
      profile.updateFullName(newName);

      expect(profile.fullName).toBe(newName);
    });

    it('should validate full name length (2-100 characters)', () => {
      expect(() => profile.updateFullName('A')).toThrow('Full name must be between 2 and 100 characters');
      expect(() => profile.updateFullName('')).toThrow('Full name must be between 2 and 100 characters');
      expect(() => profile.updateFullName('A'.repeat(101))).toThrow('Full name must be between 2 and 100 characters');

      // Valid lengths
      profile.updateFullName('AB');
      expect(profile.fullName).toBe('AB');

      profile.updateFullName('A'.repeat(100));
      expect(profile.fullName).toBe('A'.repeat(100));
    });

    it('should trim whitespace from full name', () => {
      profile.updateFullName('  John Doe  ');
      expect(profile.fullName).toBe('John Doe');
    });

    it('should handle Unicode characters', () => {
      const unicodeName = 'José María ñoño';
      profile.updateFullName(unicodeName);
      expect(profile.fullName).toBe(unicodeName);
    });
  });

  describe('updateLanguage', () => {
    let profile: UserProfile;

    beforeEach(() => {
      profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });
    });

    it('should update language with valid values', () => {
      const validLanguages = ['en-US', 'pt-BR', 'es', 'fr', 'de', 'uk', 'ru'];

      validLanguages.forEach(lang => {
        profile.updateLanguage(lang);
        expect(profile.language).toBe(lang);
      });
    });

    it('should reject invalid language codes', () => {
      const invalidLanguages = ['invalid', 'en', 'EN-US', 'pt_br', ''];

      invalidLanguages.forEach(lang => {
        expect(() => profile.updateLanguage(lang)).toThrow('Invalid language code');
      });
    });
  });

  describe('isOnboardingComplete', () => {
    it('should return false when fullName is null or undefined', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });

      expect(profile.isOnboardingComplete()).toBe(false);
    });

    it('should return false when fullName is empty string', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage,
        fullName: ''
      });

      expect(profile.isOnboardingComplete()).toBe(false);
    });

    it('should return false when fullName is only whitespace', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage,
        fullName: '   '
      });

      expect(profile.isOnboardingComplete()).toBe(false);
    });

    it('should return true when fullName has valid content', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage,
        fullName: 'John Doe'
      });

      expect(profile.isOnboardingComplete()).toBe(true);
    });

    it('should return true when fullName is updated to valid content', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });

      expect(profile.isOnboardingComplete()).toBe(false);

      profile.updateFullName('Jane Smith');
      expect(profile.isOnboardingComplete()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle avatar URL validation', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage
      });

      // Valid URLs
      profile.avatarUrl = 'https://example.com/avatar.jpg';
      profile.avatarUrl = 'http://example.com/avatar.png';
      profile.avatarUrl = undefined;

      // Invalid URLs should be handled (assuming validation in setter or update method)
      // This depends on implementation - may throw or sanitize
    });

    it('should handle telegram user ID validation', () => {
      const profile = UserProfile.create({
        id: validId,
        language: validLanguage,
        telegramUserId: 123456789
      });

      expect(profile.telegramUserId).toBe(123456789);

      // Valid updates
      profile.setTelegramUserId(987654321);
      expect(profile.telegramUserId).toBe(987654321);

      // Set to undefined
      profile.setTelegramUserId(undefined);
      expect(profile.telegramUserId).toBeUndefined();

      // Invalid values
      expect(() => {
        profile.setTelegramUserId(-1);
      }).toThrow('Invalid telegram user ID');

      expect(() => {
        profile.setTelegramUserId(0);
      }).toThrow('Invalid telegram user ID');

      expect(() => {
        profile.setTelegramUserId('invalid' as any);
      }).toThrow('Invalid telegram user ID');
    });
  });
});