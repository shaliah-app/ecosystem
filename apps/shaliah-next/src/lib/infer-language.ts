export function inferLanguage(acceptLanguageHeader?: string | null): string {
  if (!acceptLanguageHeader) {
    return 'pt-BR'
  }

  // Parse Accept-Language header
  // Format: "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7"
  const languages = acceptLanguageHeader.split(',').map(lang => {
    const [locale, quality = '1'] = lang.trim().split(';q=')
    return {
      locale: locale.split('-')[0], // Take primary language tag
      quality: parseFloat(quality)
    }
  })

  // Sort by quality descending
  languages.sort((a, b) => b.quality - a.quality)

  // Find first supported language
  const supportedLanguages = ['en', 'pt', 'es', 'fr', 'de', 'uk', 'ru']
  for (const { locale } of languages) {
    if (supportedLanguages.includes(locale)) {
      // Map to full locale
      const localeMap: Record<string, string> = {
        en: 'en-US',
        pt: 'pt-BR',
        es: 'es',
        fr: 'fr',
        de: 'de',
        uk: 'uk',
        ru: 'ru'
      }
      return localeMap[locale] || 'pt-BR'
    }
  }

  // Default fallback
  return 'pt-BR'
}