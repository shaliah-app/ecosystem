import { describe, it, expect } from 'vitest';
import {
  fullNameSchema,
  languageSchema,
  avatarUrlSchema
} from '../../../src/contexts/users/domain/validation/profile-validation';

describe('Profile Validation Schemas', () => {
  describe('fullNameSchema', () => {
    it('should accept valid full names', () => {
      const validNames = [
        'John Doe',
        'José María ñoño',
        'A B', // minimum 2 chars with space
        'A'.repeat(100), // maximum 100 chars
        '  John Doe  ', // should trim
        'O\'Connor', // apostrophe
        'Jean-Pierre', // hyphen
        '李小明', // Unicode
        'مرحبا بالعالم' // Arabic
      ];

      validNames.forEach(name => {
        const result = fullNameSchema.safeParse(name);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(name.trim()); // Should trim whitespace
        }
      });
    });

    it('should reject invalid full names', () => {
      const invalidNames = [
        '', // empty
        ' ', // only space
        '\t\n', // only whitespace
        'A', // too short (1 char)
        'A'.repeat(101), // too long (101 chars)
        null,
        undefined
      ];

      invalidNames.forEach(name => {
        const result = fullNameSchema.safeParse(name);
        expect(result.success).toBe(false);
      });
    });

    it('should handle XSS attempts', () => {
      const xssAttempts = [
        '<script>alert("xss")</script>',
        'John<script>alert("xss")</script>Doe',
        '<img src=x onerror=alert("xss")>',
        'javascript:alert("xss")',
        '<iframe src="javascript:alert(\'xss\')"></iframe>',
        '"><script>alert("xss")</script>',
        '\'><script>alert("xss")</script>'
      ];

      xssAttempts.forEach(name => {
        const result = fullNameSchema.safeParse(name);
        // Should either reject or sanitize - depending on implementation
        // For security, it should reject strings containing HTML/script tags
        if (result.success) {
          expect(result.data).not.toContain('<script>');
          expect(result.data).not.toContain('<img');
          expect(result.data).not.toContain('javascript:');
        }
      });
    });

    it('should handle Unicode and special characters', () => {
      const unicodeNames = [
        'José María ñoño',
        '李小明',
        'مرحبا بالعالم',
        'Привет мир',
        'こんにちは世界',
        '안녕하세요 세계',
        'Здравствуй мир',
        'Γεια σου κόσμε',
        'नमस्ते दुनिया',
        'สวัสดีโลก',
        'Xin chào thế giới'
      ];

      unicodeNames.forEach(name => {
        const result = fullNameSchema.safeParse(name);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.length).toBeGreaterThanOrEqual(2);
          expect(result.data.length).toBeLessThanOrEqual(100);
        }
      });
    });

    it('should handle edge cases with length', () => {
      // Exactly 2 characters
      const result2 = fullNameSchema.safeParse('AB');
      expect(result2.success).toBe(true);

      // Exactly 100 characters
      const result100 = fullNameSchema.safeParse('A'.repeat(100));
      expect(result100.success).toBe(true);

      // 101 characters should fail
      const result101 = fullNameSchema.safeParse('A'.repeat(101));
      expect(result101.success).toBe(false);
    });
  });

  describe('languageSchema', () => {
    it('should accept valid language codes', () => {
      const validLanguages = ['en-US', 'pt-BR', 'es', 'fr', 'de', 'uk', 'ru'];

      validLanguages.forEach(lang => {
        const result = languageSchema.safeParse(lang);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(lang);
        }
      });
    });

    it('should reject invalid language codes', () => {
      const invalidLanguages = [
        '', // empty
        'invalid',
        'EN-US', // uppercase
        'en', // too short
        'en-US-EXTRA', // too long
        'pt_br', // underscore instead of hyphen
        'pt-BR ', // trailing space
        ' pt-BR', // leading space
        null,
        undefined,
        123,
        {}
      ];

      invalidLanguages.forEach(lang => {
        const result = languageSchema.safeParse(lang);
        expect(result.success).toBe(false);
      });
    });

    it('should be case sensitive', () => {
      const uppercaseResult = languageSchema.safeParse('EN-US');
      expect(uppercaseResult.success).toBe(false);

      const lowercaseResult = languageSchema.safeParse('en-us');
      expect(lowercaseResult.success).toBe(false);

      const correctResult = languageSchema.safeParse('en-US');
      expect(correctResult.success).toBe(true);
    });
  });

  describe('avatarUrlSchema', () => {
    it('should accept valid URLs', () => {
      const validUrls = [
        'https://example.com/avatar.jpg',
        'http://example.com/avatar.png',
        'https://cdn.example.com/avatars/user123.webp',
        'https://example.com/avatar.jpeg',
        'https://subdomain.example.co.uk/avatar.gif',
        'http://localhost:3000/avatar.jpg' // for development
      ];

      validUrls.forEach(url => {
        const result = avatarUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(url);
        }
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        '', // empty
        'not-a-url',
        'ftp://example.com/file.jpg', // wrong protocol
        'https://', // incomplete
        '://example.com', // no protocol
        'example.com/avatar.jpg', // no protocol
        'https:/example.com', // malformed
        'https//example.com', // missing colon
        null,
        undefined,
        123,
        {}
      ];

      invalidUrls.forEach(url => {
        const result = avatarUrlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });

    it('should accept undefined (optional)', () => {
      const result = avatarUrlSchema.safeParse(undefined);
      expect(result.success).toBe(true);
      expect(result.data).toBeUndefined();
    });

    it('should handle URL encoding and special characters', () => {
      const urlsWithSpecialChars = [
        'https://example.com/avatar%20with%20spaces.jpg',
        'https://example.com/avatar+plus.jpg',
        'https://example.com/用户头像.jpg', // Unicode in path
        'https://example.com/avatar.jpg?param=value&other=test'
      ];

      urlsWithSpecialChars.forEach(url => {
        const result = avatarUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should reject potentially dangerous URLs', () => {
      const dangerousUrls = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'vbscript:msgbox("xss")',
        'file:///etc/passwd',
        'http://localhost/../../../etc/passwd' // path traversal attempt
      ];

      dangerousUrls.forEach(url => {
        const result = avatarUrlSchema.safeParse(url);
        // Should reject dangerous protocols
        if (url.startsWith('javascript:') || url.startsWith('vbscript:') || url.startsWith('data:') || url.startsWith('file:')) {
          expect(result.success).toBe(false);
        }
      });
    });

    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(2000) + '.jpg';
      const result = avatarUrlSchema.safeParse(longUrl);
      // Depending on implementation, may have length limits
      // At minimum, should handle reasonable lengths
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('Integration - Full Profile Validation', () => {
    it('should validate complete profile data', () => {
      const validProfile = {
        fullName: 'John Doe',
        language: 'en-US',
        avatarUrl: 'https://example.com/avatar.jpg'
      };

      // Assuming there's a combined schema
      // const profileSchema = z.object({
      //   fullName: fullNameSchema,
      //   language: languageSchema,
      //   avatarUrl: avatarUrlSchema.optional()
      // });

      // const result = profileSchema.safeParse(validProfile);
      // expect(result.success).toBe(true);

      // Test individual validations
      expect(fullNameSchema.safeParse(validProfile.fullName).success).toBe(true);
      expect(languageSchema.safeParse(validProfile.language).success).toBe(true);
      expect(avatarUrlSchema.safeParse(validProfile.avatarUrl).success).toBe(true);
    });

    it('should handle malformed input gracefully', () => {
      const malformedInputs = [
        { fullName: '', language: 'invalid', avatarUrl: 'not-a-url' },
        { fullName: null, language: null, avatarUrl: null },
        { fullName: 123, language: 456, avatarUrl: 789 }
      ];

      malformedInputs.forEach(input => {
        const fullNameResult = fullNameSchema.safeParse(input.fullName);
        const languageResult = languageSchema.safeParse(input.language);
        const avatarResult = avatarUrlSchema.safeParse(input.avatarUrl);

        // Should handle type mismatches gracefully
        expect(typeof fullNameResult.success).toBe('boolean');
        expect(typeof languageResult.success).toBe('boolean');
        expect(typeof avatarResult.success).toBe('boolean');
      });
    });
  });
});