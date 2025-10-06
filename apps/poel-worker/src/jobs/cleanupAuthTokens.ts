import { z } from "zod";
import type { JobContext } from "../types/job.ts";

// Job data schema for cleanup_auth_tokens (empty since it's a scheduled cleanup)
const cleanupAuthTokensSchema = z.object({});

export const jobType = "cleanup_auth_tokens" as const;
export const schema = cleanupAuthTokensSchema;

export async function process(
  payload: z.infer<typeof schema>,
  ctx: JobContext,
) {
  ctx.logger.info("Starting cleanup of expired auth tokens");

  try {
    // Delete expired tokens using Supabase
    const { data, error } = await ctx.supabase
      .from("auth_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    const deletedCount = data?.length || 0;
    ctx.logger.info("Cleaned up expired auth tokens", { deletedCount });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    ctx.logger.error("Error cleaning up auth tokens", { error: errorMessage });
    throw new Error(`Failed to cleanup auth tokens: ${errorMessage}`);
  }
}
