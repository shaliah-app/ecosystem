export interface CreateUserProfileProps {
  id: string;
  language: string;
  fullName?: string;
  avatarUrl?: string;
  telegramUserId?: number;
}

export class UserProfile {
  constructor(
    public readonly id: string,
    public fullName: string | undefined,
    public avatarUrl: string | undefined,
    public language: string,
    public telegramUserId: number | undefined,
    public activeSpaceId: string | undefined,
    public readonly createdAt: Date,
    public updatedAt: Date
  ) {}

  /**
   * Factory method to create a new UserProfile
   */
  static create(props: CreateUserProfileProps): UserProfile {
    if (props.id === null || props.id === undefined || props.id === '') {
      throw new Error('ID is required');
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(props.id)) {
      throw new Error('Invalid UUID format');
    }

    if (!props.language) {
      throw new Error('Language is required');
    }

    return new UserProfile(
      props.id,
      props.fullName?.trim(),
      props.avatarUrl,
      props.language,
      props.telegramUserId,
      undefined, // activeSpaceId
      new Date(), // createdAt
      new Date() // updatedAt
    );
  }

  /**
   * Update the user's full name
   */
  updateFullName(fullName: string): void {
    if (fullName.length < 2 || fullName.length > 100) {
      throw new Error('Full name must be between 2 and 100 characters');
    }
    this.fullName = fullName.trim();
    this.updatedAt = new Date();
  }

  /**
   * Update the user's preferred language
   */
  updateLanguage(language: string): void {
    const supportedLanguages = ['en-US', 'pt-BR', 'es', 'fr', 'de', 'uk', 'ru'];
    if (!supportedLanguages.includes(language)) {
      throw new Error('Invalid language code');
    }
    this.language = language;
    this.updatedAt = new Date();
  }

  /**
   * Check if the user has completed onboarding
   * Onboarding is complete when full_name is set and not empty/whitespace
   */
  isOnboardingComplete(): boolean {
    return this.fullName !== undefined && this.fullName !== null && this.fullName.trim().length > 0;
  }

  /**
   * Set telegram user ID with validation
   */
  setTelegramUserId(telegramUserId: number | undefined): void {
    if (telegramUserId !== undefined && (typeof telegramUserId !== 'number' || telegramUserId <= 0)) {
      throw new Error('Invalid telegram user ID');
    }
    (this as any).telegramUserId = telegramUserId;
    this.updatedAt = new Date();
  }
}