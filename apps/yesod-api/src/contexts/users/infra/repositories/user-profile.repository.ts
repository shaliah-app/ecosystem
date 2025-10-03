import { eq } from 'drizzle-orm';
import { db } from '../../../../db';
import { userProfiles } from '../../../../db/schema';
import { UserProfile } from '../../domain/entities/user-profile';

export class UserProfileRepository {
  /**
   * Find a user profile by ID
   */
  async findById(id: string): Promise<UserProfile | null> {
    const result = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, id))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    const row = result[0]!;
    return new UserProfile(
      row.id,
      row.fullName ?? undefined,
      row.avatarUrl ?? undefined,
      row.language,
      row.telegramUserId ?? undefined,
      row.activeSpaceId ?? undefined,
      row.createdAt,
      row.updatedAt
    );
  }

  /**
   * Update a user profile
   */
  async update(profile: UserProfile): Promise<UserProfile> {
    const result = await db
      .update(userProfiles)
      .set({
        fullName: profile.fullName ?? null,
        avatarUrl: profile.avatarUrl ?? null,
        language: profile.language,
        telegramUserId: profile.telegramUserId ?? null,
        activeSpaceId: profile.activeSpaceId ?? null,
        updatedAt: profile.updatedAt,
      })
      .where(eq(userProfiles.id, profile.id))
      .returning();

    if (result.length === 0) {
      throw new Error(`User profile with id ${profile.id} not found`);
    }

    const row = result[0]!;
    return new UserProfile(
      row.id,
      row.fullName ?? undefined,
      row.avatarUrl ?? undefined,
      row.language,
      row.telegramUserId ?? undefined,
      row.activeSpaceId ?? undefined,
      row.createdAt,
      row.updatedAt
    );
  }
}