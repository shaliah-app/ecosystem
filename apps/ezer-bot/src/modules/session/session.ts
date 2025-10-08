import { session as sessionMiddleware } from "grammy";
import { SessionData } from "../../types/context";

export const session = sessionMiddleware({
  initial: (): SessionData => ({
    // Initialize session data here
  }),
});
