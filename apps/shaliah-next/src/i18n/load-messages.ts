// Dynamic message loading utility
// This file provides functions to load internationalization messages dynamically

export type SupportedLocale = 'en' | 'pt-BR'

const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'pt-BR']

/**
 * Checks if a locale is supported
 */
export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale)
}

/**
 * Gets the default locale
 */
export function getDefaultLocale(): SupportedLocale {
  return 'pt-BR'
}

/**
 * Normalizes a locale string to a supported locale
 * Maps 'pt' to 'pt-BR' and ensures the locale is supported
 */
export function normalizeLocale(locale: string): SupportedLocale {
  // Handle common mappings
  if (locale === 'pt') {
    return 'pt-BR'
  }

  // Check if it's already a supported locale
  if (isSupportedLocale(locale)) {
    return locale
  }

  // Extract primary language and try to map
  const primaryLang = locale.split('-')[0]
  if (primaryLang === 'pt') {
    return 'pt-BR'
  }

  // Default fallback
  return getDefaultLocale()
}

/**
 * Dynamically loads messages for a given locale
 * This function is used by next-intl for server-side rendering
 * Merges common messages with feature-specific messages
 */
export async function loadMessages(locale: string): Promise<Record<string, any>> {
  const normalizedLocale = normalizeLocale(locale)

  try {
    // Load common messages
    const commonMessages = await import(`../../messages/${normalizedLocale}.json`)
    let messages = commonMessages.default

    // Load feature-specific messages from modules
    try {
      // Load ezer-auth module messages
      const ezerAuthMessages = await import(`../modules/ezer-auth/messages/${normalizedLocale}.json`)
      messages = {
        ...messages,
        ...ezerAuthMessages.default
      }
    } catch (featureError) {
      // Feature messages are optional, continue without them
      console.warn(`Feature messages not found for locale ${normalizedLocale}:`, featureError)
    }

    return messages
  } catch (error) {
    console.error(`Failed to load messages for locale ${normalizedLocale}:`, error)

    // Fallback to default locale
    const defaultLocale = getDefaultLocale()
    if (normalizedLocale !== defaultLocale) {
      try {
        const fallbackMessages = await import(`../../messages/${defaultLocale}.json`)
        return fallbackMessages.default
      } catch (fallbackError) {
        console.error(`Failed to load fallback messages for locale ${defaultLocale}:`, fallbackError)
      }
    }

    // Ultimate fallback - empty messages object
    return {}
  }
}

/**
 * Preloads messages for multiple locales (useful for build-time optimization)
 */
export async function preloadMessages(locales: SupportedLocale[] = SUPPORTED_LOCALES): Promise<Record<string, Record<string, any>>> {
  const results: Record<string, Record<string, any>> = {}

  await Promise.all(
    locales.map(async (locale) => {
      results[locale] = await loadMessages(locale)
    })
  )

  return results
}