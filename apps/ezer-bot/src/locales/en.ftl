# Welcome messages
welcome-message =
    🎵 *Welcome to Ezer Bot!* 🎵

    Hello { $first_name }! I'm your musical companion for the Kinnor ecosystem.

    I can help you with:
    • Song search and discovery
    • Audio matching and identification
    • Playlist management
    • And much more!

    Use /help to see all available commands.

# Inline keyboard buttons
search-button = 🎵 Search Songs
playlists-button = 📋 My Playlists
help-button = ❓ Help

# Callback replies
search-reply = 🎵 *Song Search*

    Search functionality coming soon!
playlists-reply = 📋 *My Playlists*

    Playlist management coming soon!
help-reply = ❓ *Help*

    Available commands:
    /start - Welcome message
    /help - This help message

# Ezer authentication messages (from contracts/bot-start-command.md)
auth-link-success = ✅ Account linked successfully!

    Your Telegram is now connected to your Shaliah account. You can start using the bot.

auth-link-error-invalid = ❌ Invalid link

    This authentication link is not valid. Please generate a new link in your Shaliah profile.

auth-link-error-expired = ⏰ Link expired

    This link has expired. Authentication links are valid for only 15 minutes.

    Please generate a new link in your Shaliah profile.

auth-link-error-used = 🔒 Link already used

    This link has already been used to link an account and cannot be reused.

    If you need to unlink and link again, sign out from Shaliah and generate a new link.

auth-link-error-invalidated = ⚠️ Link canceled

    This link was canceled because a new link was generated.

    Use the most recent link from your Shaliah profile.

auth-link-error-collision = ⚠️ This Telegram account is already linked

    This Telegram account is already linked to another Shaliah account.

    If you want to change the link, first sign out from the other account.

auth-link-error-generic = ❌ Processing error

    An error occurred while linking your account. Please try again in a few moments.

    If the problem persists, contact support.

account-unlinked = ⚠️ Your Shaliah account is no longer linked

    Please visit your Shaliah profile and generate a new QR code to connect.