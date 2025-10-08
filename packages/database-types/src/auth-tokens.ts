// Auth tokens table types - generated from database schema
export interface AuthToken {
  id: string;
  token: string;
  user_id: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
  is_active: boolean;
}

export interface AuthTokenInsert {
  id?: string;
  token: string;
  user_id: string;
  created_at?: string;
  expires_at: string;
  used_at?: string | null;
  is_active?: boolean;
}

// Legacy type aliases for backward compatibility with existing code
export type AuthTokenRow = AuthToken
