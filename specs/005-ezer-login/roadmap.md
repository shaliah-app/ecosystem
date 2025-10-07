# Roadmap: Ezer Bot Authentication Link - Internationalization

**Feature**: 005-ezer-login  
**Applications**: shaliah-next (web app), ezer-bot (Telegram bot)  
**Date**: 2025-01-16  
**Status**: Active Development

## Current Language Support

### Implemented (MVP)
- **Portuguese (Brazil)**: `pt-BR` - Complete implementation
- **English (US)**: `en-US` - Complete implementation

Both languages are fully implemented across both applications:

**Shaliah Web App (Next.js + next-intl)**:
- Translations in `messages/pt-BR.json` and `messages/en.json`
- UI components, error messages, validation text
- Language selector in profile page
- Server-side rendering support

**Ezer Bot (grammY + @grammyjs/i18n)**:
- Translations in `locales/pt-BR.ftl` and `locales/en.ftl`
- Bot commands, error responses, success messages
- Fluent format with rich text support
- Language synchronization from Shaliah preferences

**Cross-Application Features**:
- Language synchronization between Shaliah and Ezer bot
- Consistent terminology across both apps
- Unified user experience

## Planned Language Support

### Phase 2: European Languages (Q2 2025)
- **Spanish (Spain)**: `es-ES`
- **French (France)**: `fr-FR`
- **German (Germany)**: `de-DE`

### Phase 3: Additional European Languages (Q3 2025)
- **Italian (Italy)**: `it-IT`
- **Portuguese (Portugal)**: `pt-PT`
- **Dutch (Netherlands)**: `nl-NL`

### Phase 4: Asian Languages (Q4 2025)
- **Japanese**: `ja-JP`
- **Korean**: `ko-KR`
- **Chinese (Simplified)**: `zh-CN`

### Phase 5: Additional Languages (2026)
- **Russian**: `ru-RU`
- **Arabic**: `ar-SA`
- **Hindi**: `hi-IN`

## Implementation Guidelines

### Language Addition Process

1. **Complete Translation Coverage Required**
   - All UI text in Shaliah web app
   - All bot messages and error responses
   - All validation messages
   - All help text and documentation

2. **Quality Assurance**
   - Native speaker review for each language
   - Cultural adaptation (not just translation)
   - Testing with native speakers
   - Accessibility compliance

3. **Technical Requirements**
   - Shaliah: Add to `messages/{locale}.json`
   - Ezer Bot: Add to `locales/{locale}.ftl`
   - Update language selector in profile
   - Test language synchronization
   - Update documentation

### Do NOT Add Partial Translations

**Critical Rule**: Never add a language with incomplete translations. This creates a poor user experience and maintenance burden.

**Examples of what NOT to do**:
- Add Spanish but only translate 50% of messages
- Add French but forget error messages
- Add German but skip bot responses
- Add any language without complete coverage

**What to do instead**:
- Complete all translations before release
- Test thoroughly with native speakers
- Ensure all edge cases are covered
- Maintain translation quality standards

## Language-Specific Considerations

### Spanish (es-ES)
- **Target Market**: Spain, Latin America
- **Cultural Notes**: Formal vs informal address (tú vs usted)
- **Technical**: UTF-8 support, special characters (ñ, á, é, í, ó, ú)

### French (fr-FR)
- **Target Market**: France, Canada, Belgium, Switzerland
- **Cultural Notes**: Formal business language, gender agreement
- **Technical**: Accent marks (à, é, è, ê, ë, î, ï, ô, ù, û, ü, ÿ, ç)

### German (de-DE)
- **Target Market**: Germany, Austria, Switzerland
- **Cultural Notes**: Compound words, formal address (Sie)
- **Technical**: Umlauts (ä, ö, ü), ß character, long compound words

### Japanese (ja-JP)
- **Target Market**: Japan
- **Cultural Notes**: Honorifics, formal business language
- **Technical**: UTF-8, Hiragana, Katakana, Kanji support

### Korean (ko-KR)
- **Target Market**: South Korea
- **Cultural Notes**: Formal vs informal speech levels
- **Technical**: UTF-8, Hangul support

### Chinese (zh-CN)
- **Target Market**: Mainland China
- **Cultural Notes**: Simplified characters, formal business language
- **Technical**: UTF-8, Simplified Chinese characters

## Translation Quality Standards

### Required for Each Language

1. **Completeness**
   - 100% of UI text translated
   - 100% of bot messages translated
   - 100% of error messages translated
   - 100% of help text translated

2. **Accuracy**
   - Native speaker review
   - Cultural appropriateness
   - Technical terminology consistency
   - Context-aware translations

3. **Consistency**
   - Consistent terminology across all components
   - Consistent tone and style
   - Consistent formatting and punctuation

4. **Testing**
   - End-to-end testing in target language
   - Error scenario testing
   - User experience testing with native speakers

## Technical Implementation

### Shaliah Web App (Next.js + next-intl)
```typescript
// apps/shaliah-next/src/i18n/config.ts
export const supportedLocales = ['en-US', 'pt-BR', 'es-ES', 'fr-FR', 'de-DE']

// apps/shaliah-next/src/components/LanguageSelector.tsx
const languageOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
  { value: 'es-ES', label: 'Español' },
  { value: 'fr-FR', label: 'Français' },
  { value: 'de-DE', label: 'Deutsch' },
]

// apps/shaliah-next/messages/es-ES.json
{
  "ezerAuth": {
    "connectToBot": "Conectar al Bot Ezer",
    "orUseThisLink": "O puedes usar este [enlace]",
    "expiresIn": "Expira en",
    "linked": "Vinculado",
    "generateNewLink": "Generar nuevo enlace"
  }
}
```

### Ezer Bot (grammY + @grammyjs/i18n)
```typescript
// apps/ezer-bot/src/locales/es.ftl
auth-link-success = ✅ ¡Cuenta vinculada con éxito!\n\nTu Telegram ahora está conectado a tu cuenta Shaliah. Puedes empezar a usar el bot.

auth-link-error-invalid = ❌ Enlace inválido\n\nEste enlace de autenticación no es válido. Por favor, genera un nuevo enlace en tu perfil de Shaliah.

// apps/ezer-bot/src/modules/auth-link.ts
const supportedLocales = ['en', 'pt', 'es', 'fr', 'de']

function mapShaliahToTelegramLocale(shaliahLocale: string): string {
  const map: Record<string, string> = {
    'en-US': 'en',
    'pt-BR': 'pt',
    'es-ES': 'es',
    'fr-FR': 'fr',
    'de-DE': 'de',
  }
  return map[shaliahLocale] || 'en'
}
```

### Cross-Application Synchronization
```typescript
// Language sync happens in Ezer Bot when user links account
async function syncLanguageFromShaliah(ctx: BotContext, shaliahUserId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: eq(userProfiles.userId, shaliahUserId)
  })
  
  if (profile?.language) {
    const telegramLocale = mapShaliahToTelegramLocale(profile.language)
    await ctx.i18n.locale(telegramLocale)
  }
}
```

## Resource Requirements

### Per Language Addition
- **Shaliah Web App**: 1-2 days for complete translation
  - UI components, error messages, validation text
  - Language selector updates
  - Server-side rendering testing
- **Ezer Bot**: 1-2 days for complete translation
  - Bot commands, error responses, success messages
  - Fluent format translations
  - Language synchronization testing
- **Cross-Application Testing**: 1-2 days
  - Language sync between apps
  - End-to-end user flows
  - Error scenario testing
- **Review Time**: 1-2 days for native speaker review
- **Total Time**: 4-8 days per language

### Team Requirements
- Native speaker translator (both apps)
- Technical reviewer (Next.js + grammY expertise)
- QA tester (web app + bot testing)
- Product manager approval

## Success Metrics

### User Adoption
- Track language usage in analytics
- Monitor user feedback per language
- Measure support ticket volume by language

### Quality Metrics
- Translation accuracy (native speaker review)
- User satisfaction scores by language
- Error rate by language (technical issues)

## Future Considerations

### Advanced Features
- **RTL Support**: Arabic, Hebrew (requires UI layout changes)
- **Regional Variants**: pt-PT vs pt-BR, en-GB vs en-US
- **Dynamic Language Detection**: Auto-detect user's preferred language
- **Language Learning**: Help users learn new languages through the app

### Technical Improvements
- **Translation Management**: Professional translation service integration
- **A/B Testing**: Test different translations for effectiveness
- **Analytics**: Track which languages are most used
- **Performance**: Optimize for multiple language support

## Conclusion

Language support is a critical feature for global user adoption. The roadmap prioritizes European languages first (largest user base), followed by Asian languages (growing markets).

**Key Principles**:
1. Complete translation coverage (no partial implementations)
2. Native speaker quality assurance
3. Cultural adaptation beyond translation
4. Thorough testing before release

**Next Steps**:
1. Complete current MVP (pt-BR, en-US)
2. Gather user feedback on language preferences
3. Prioritize Phase 2 languages based on user demand
4. Begin Spanish (es-ES) implementation

---

**Last Updated**: 2025-01-16  
**Next Review**: Q2 2025  
**Owner**: Product Team  
**Stakeholders**: Engineering, Design, Marketing
