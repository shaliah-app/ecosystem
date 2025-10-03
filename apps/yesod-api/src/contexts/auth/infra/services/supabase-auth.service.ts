import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../../../../config/env';
import { createLogger } from '@yesod/logger';

export class SupabaseAuthService {
  private supabase: SupabaseClient;
  private logger = createLogger({ serviceName: 'supabase-auth-service' });

  constructor() {
    this.supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  async sendMagicLink(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${env.SUPABASE_URL}/auth/callback`, // This might need to be configured
        },
      });

      if (error) {
        this.logger.error('Failed to send magic link', {
          email,
          error: error.message,
        });
        throw new Error(`Failed to send magic link: ${error.message}`);
      }

      this.logger.info('Magic link sent successfully', { email });
    } catch (error) {
      this.logger.error('Unexpected error sending magic link', {
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}