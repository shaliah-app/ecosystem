import type { Context } from "../../types/context";
import { isAuthenticated } from "../session/session-service";
import { noTokenMessage } from "./authentication-messages";

export async function authMiddleware(
  ctx: Context,
  next: () => Promise<void>
): Promise<void> {
  const startCommand = ctx.message?.text?.startsWith("/start");
  const authenticated = await isAuthenticated(ctx);
  if (authenticated || startCommand) {
    return await next();
  }
  await noTokenMessage(ctx);
  return;
}
