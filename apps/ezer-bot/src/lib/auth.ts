import { AuthToken, UserProfile } from "@yesod/database-types";
import { supabase } from "./supabase";
import { logger } from "../logger";

/**
 * The result of validating an authentication token.
 *
 * - If `success` is true, `token` contains the valid AuthToken.
 * - If `success` is false, `reason` indicates why validation failed:
 *   - 'invalid-format': The token string does not match the expected format.
 *   - 'not-found': No token was found in the database.
 *   - 'expired': The token has expired.
 *   - 'used': The token has already been used.
 *   - 'cancelled': The token was invalidated or cancelled.
 */
export type TokenValidationResult =
  | {
      success: true;
      token: AuthToken;
    }
  | {
      success: false;
      reason: "invalid-format" | "not-found" | "expired" | "used" | "cancelled";
    };

/**
 * Validates an authentication token string.
 *
 * Checks the token format, existence, expiry, usage, and cancellation status.
 *
 * @param tokenStr - The token string to validate.
 * @returns A promise resolving to a TokenValidationResult indicating the outcome.
 *
 * Throws if a database error occurs.
 */

export async function validateToken(
  tokenStr: string
): Promise<TokenValidationResult> {
  // Basic token format guard (32+ alphanumeric)
  if (!/^[a-zA-Z0-9]{32,}$/.test(tokenStr)) {
    return { success: false, reason: "invalid-format" };
  }

  const { data, error } = await supabase
    .from("auth_tokens")
    .select("*")
    .eq("token", tokenStr)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const token = data as AuthToken | null;
  if (!token) {
    return { success: false, reason: "not-found" };
  }

  const now = new Date();
  const expiresAt = new Date(token.expires_at);
  const isValid =
    token.is_active === true && token.used_at == null && expiresAt > now;

  if (!isValid) {
    const isExpired = expiresAt <= now;
    const isUsed = token.used_at != null;

    if (isExpired) {
      return { success: false, reason: "expired" };
    } else if (isUsed) {
      return { success: false, reason: "used" };
    } else {
      return { success: false, reason: "cancelled" };
    }
  }

  return { success: true, token };
}

/**
 * Links a Telegram user ID to a user profile.
 * 
 * @param userId - The user ID to link to.
 * @param telegramUserId - The Telegram user ID to link.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function linkTelegramUser(userId: string, telegramUserId: number): Promise<boolean> {
  const { error } = await supabase
    .from("user_profiles")
    .update({ telegram_user_id: telegramUserId })
    .eq("id", userId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Marks an authentication token as used.
 * 
 * @param tokenId - The ID of the token to mark as used.
 * @returns A promise that resolves to true if successful, false otherwise.
 */
export async function markTokenAsUsed(tokenId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("auth_tokens")
      .update({ used_at: new Date().toISOString() })
      .eq("id", tokenId)
      .eq("is_active", true)
      .is("used_at", null);

    if (error) {
      throw error;
    }

    return true;
  } catch (err) {
    // Don't fail the flow if token marking fails
    logger.warn("Failed to mark token as used", {
      tokenId,
      error: err instanceof Error ? err.message : "Unknown error",
    });
    return false;
  }
}

/**
 * Unlinks a Telegram user from their user profile.
 * 
 * @param telegramUserId - The Telegram user ID to unlink.
 * @returns A promise that resolves to the user profile that was unlinked, or null if not found.
 */
export async function unlinkTelegramUser(telegramUserId: number): Promise<UserProfile | null> {
  // First, get the current profile to return it
  const { data: profile, error: fetchError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (!profile) {
    return null;
  }

  // Perform the unlink operation
  const { error: unlinkError } = await supabase
    .from("user_profiles")
    .update({ telegram_user_id: null })
    .eq("telegram_user_id", telegramUserId);

  if (unlinkError) {
    throw unlinkError;
  }

  return profile as UserProfile;
}

/**
 * Finds a user profile by the associated Telegram user ID.
 *
 * @param {number} telegramUserId - The Telegram user ID to search for.
 * @returns {Promise<UserProfile | null>} A promise that resolves to the user profile if found, or null if not found.
 * @throws Will throw an error if a database error occurs.
 */
export async function findUserProfileByTelegramUserId(
  telegramUserId: number
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("telegram_user_id", telegramUserId)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return (data as UserProfile) ?? null;
}
