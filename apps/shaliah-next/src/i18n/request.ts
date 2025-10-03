import {getRequestConfig} from 'next-intl/server';
import { headers } from 'next/headers';

async function getLocaleFromHeaders() {
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';

  // Parse Accept-Language header
  const languages = acceptLanguage.split(',').map(lang => {
    const [locale, q] = lang.trim().split(';q=');
    return {
      locale: locale.split('-')[0], // Get primary language
      quality: q ? parseFloat(q) : 1
    };
  }).sort((a, b) => b.quality - a.quality);

  // Check if any supported locale matches
  const supportedLocales = ['en', 'pt'];
  for (const lang of languages) {
    if (supportedLocales.includes(lang.locale)) {
      return lang.locale === 'pt' ? 'pt-BR' : 'en';
    }
  }

  // Default to pt-BR
  return 'pt-BR';
}

export default getRequestConfig(async ({requestLocale}) => {
  // Use the locale from the middleware or detect from headers
  let locale = await requestLocale;
  if (!locale) {
    locale = await getLocaleFromHeaders();
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});