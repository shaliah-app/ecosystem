// User profiles table types - generated from database schema
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  language: string;
  telegram_user_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  id?: string;
  user_id: string;
  full_name?: string | null;
  language?: string;
  telegram_user_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

// Legacy type aliases for backward compatibility with existing code
export type UserProfileRow = UserProfile
