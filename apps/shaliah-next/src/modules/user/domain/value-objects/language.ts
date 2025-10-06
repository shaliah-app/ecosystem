// Language Value Object
// Represents a supported language in the system

export type SupportedLanguage = 'en' | 'pt-BR'

export class Language {
  private constructor(private readonly _value: SupportedLanguage) {}

  static readonly ENGLISH = new Language('en')
  static readonly PORTUGUESE_BRAZIL = new Language('pt-BR')

  static readonly SUPPORTED_LANGUAGES = [
    Language.ENGLISH,
    Language.PORTUGUESE_BRAZIL,
  ] as const

  static create(value: string): Language {
    const supported = Language.SUPPORTED_LANGUAGES.find(lang => lang._value === value)
    if (!supported) {
      throw new Error(`Unsupported language: ${value}`)
    }
    return supported
  }

  static fromString(value: string): Language | null {
    try {
      return Language.create(value)
    } catch {
      return null
    }
  }

  get value(): SupportedLanguage {
    return this._value
  }

  equals(other: Language): boolean {
    return this._value === other._value
  }

  toString(): string {
    return this._value
  }

  get displayName(): string {
    switch (this._value) {
      case 'en':
        return 'English'
      case 'pt-BR':
        return 'Português (Brasil)'
      default:
        return this._value
    }
  }
}