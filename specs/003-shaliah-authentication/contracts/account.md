```typescript
// apps/yesod-api/src/routes/auth/account.ts

import { Hono } from 'hono';
import { db } from '../../db';
import { userProfiles } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';
import { env } from '../../config/env';

const app = new Hono();

// This should be the Supabase Admin client
const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * @description Delete a user's own account
 * @returns {object} 200 - Account deletion initiated
 * @returns {object} 401 - Unauthorized
 * @returns {object} 500 - Failed to delete account
 */
app.delete(
  '/account',
  // TODO: Add middleware to get authenticated user ID
  async (c) => {
    const userId = c.get('userId'); // Assumes middleware provides this

    // Supabase Auth does not support soft-delete via API.
    // We will mark the user profile as 'deleted' and rely on a background job
    // or manual process to sync with `auth.users` for permanent deletion after the grace period.
    // A more direct approach is to call the admin API to delete the user immediately.

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      // TODO: Log error to Sentry
      return c.json({ message: 'Failed to delete account' }, 500);
    }

    // The `onDelete: 'cascade'` on the UserProfile table will handle deleting the profile row.

    return c.json({ message: 'Account scheduled for deletion.' });
  }
);

export default app;
```
