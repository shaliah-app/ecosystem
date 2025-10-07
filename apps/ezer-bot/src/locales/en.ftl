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

# Dependency check messages (from 007-ezer-fix)
shaliah-offline-message = 
    🔧 *Shaliah is currently offline*
    
    I need Shaliah to be running to help you. Please try again later.

# Development mode logging messages
dev-mode-bypass-log = 🔧 Development mode: Bypassing Shaliah dependency check
dev-mode-config-log = 🔧 Development mode: NODE_ENV={ $node_env } detected, dependency checks disabled

# Health check logging messages
health-check-start-log = 🔍 Starting Shaliah health check at { $url }
health-check-success-log = ✅ Shaliah health check successful (response time: { $response_time }ms)
health-check-failure-log = ❌ Shaliah health check failed: { $error }
health-check-timeout-log = ⏰ Shaliah health check timed out after { $timeout }ms
health-check-config-error-log = ⚠️ Health check configuration error: { $error }

# Unlink account messages
unlink-success = ✅ Account unlinked successfully!

    Your Telegram account has been disconnected from your Shaliah account.

    To link again, visit your Shaliah profile and generate a new QR code.

unlink-error-not-linked = ⚠️ Account not linked

    Your Telegram account is not currently linked to any Shaliah account.

unlink-error-no-user = ❌ Unable to identify user

    There was an error identifying your Telegram account. Please try again.

unlink-error-generic = ❌ Unlink failed

    An error occurred while unlinking your account. Please try again later.

link-account-button = 🔗 Link Account

# Unlink confirmation flow
unlink-button = 🔗 Unlink Account
unlink-confirmation = ⚠️ *Confirm Account Unlink*

    Are you sure you want to unlink your Telegram account from your Shaliah account?

    This will disconnect your accounts and you'll need to link them again to use the bot.

confirm-unlink-button = ✅ Yes, Unlink
cancel-button = ❌ Cancel
unlink-cancelled = ✅ Unlink cancelled

    Your account remains linked.