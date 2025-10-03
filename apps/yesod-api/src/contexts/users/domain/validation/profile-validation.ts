import { z } from 'zod';

/**
 * Supported languages for the application
 */
export const SUPPORTED_LANGUAGES = [
  'en-US',
  'pt-BR',
  'es',
  'fr',
  'de',
  'uk',
  'ru'
] as const;

export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];

/**
 * Schema for validating full name
 * - 2-100 characters
 * - Trimmed whitespace
 * - Must not be empty after trimming
 * - Must not contain HTML/script tags for XSS protection
 */
export const fullNameSchema = z
  .string()
  .min(1, 'Full name cannot be empty')
  .transform((val) => val.trim())
  .refine((val) => val.length >= 2, 'Full name must be at least 2 characters')
  .refine((val) => val.length <= 100, 'Full name must be at most 100 characters')
  .refine((val) => {
    // XSS protection: reject strings containing HTML/script tags
    const dangerousPatterns = [
      /<script/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i, // event handlers like onclick=
      /<img/i
    ];
    return !dangerousPatterns.some(pattern => pattern.test(val));
  }, 'Full name contains potentially dangerous content');

/**
 * Schema for validating language preference
 * - Must be one of the supported languages
 */
export const languageSchema = z.enum(SUPPORTED_LANGUAGES);

/**
 * Schema for validating avatar URL
 * - Must be a valid HTTP or HTTPS URL if provided
 * - Optional field (undefined is allowed)
 * - Rejects dangerous protocols, malformed URLs, and XSS attempts
 */
export const avatarUrlSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (val === undefined) {
      return true; // Allow undefined
    }
    if (val === null) {
      return false; // Reject null
    }
    if (typeof val !== 'string') {
      return false; // Reject numbers, objects
    }
    if (val.trim() === '') {
      return false; // Reject empty strings
    }
    
    try {
      const url = new URL(val);
      
      // Reject dangerous protocols
      const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:'];
      if (dangerousProtocols.some(protocol => val.toLowerCase().startsWith(protocol))) {
        return false;
      }
      
      // Ensure URL starts with proper http:// or https:// format (two slashes)
      if (!val.startsWith('http://') && !val.startsWith('https://')) {
        return false;
      }
      
      // Allow HTTP and HTTPS (including localhost for development)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return false;
      }
      
      // Reject URLs with dangerous characters in path/query/hash
      const dangerousChars = /[<>'"\\]/;
      if (dangerousChars.test(url.pathname) || dangerousChars.test(url.search) || dangerousChars.test(url.hash)) {
        return false;
      }
      
      return true;
    } catch {
      return false; // Invalid URL format
    }
  }, 'Invalid avatar URL - must be a valid HTTP or HTTPS URL');

/**
 * Schema for profile update input
 * - At least one field must be provided
 */
export const profileUpdateSchema = z
  .object({
    full_name: fullNameSchema.optional(),
    avatar_url: avatarUrlSchema,
    language: languageSchema.optional(),
  })
  .refine(
    (data) => data.full_name !== undefined || data.avatar_url !== undefined || data.language !== undefined,
    {
      message: 'At least one field must be provided for update',
      path: ['root'],
    }
  );