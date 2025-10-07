import { Context as BaseContext, SessionFlavor } from "grammy";
import { MenuFlavor } from "@grammyjs/menu";
import { I18nFlavor } from "@grammyjs/i18n";

// Define the session data structure
export interface SessionData {
  // Add session properties here as needed
  // For example:
  // userState: 'idle' | 'searching' | 'matching'
  // searchQuery?: string
  // currentPlaylist?: string
}

// Extend the base context with session and menu flavors
export type Context = BaseContext &
  SessionFlavor<SessionData> &
  MenuFlavor &
  I18nFlavor;
