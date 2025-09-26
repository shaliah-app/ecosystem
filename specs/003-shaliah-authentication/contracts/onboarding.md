```typescript
// apps/yesod-api/src/routes/auth/onboarding.ts

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { userProfiles } from '../../db/schema';
import { db } from '../../db';
import { eq } from 'drizzle-orm';

const app = new Hono();

const OnboardingSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  language: z.string().regex(/^(en-US|pt-BR)$/, 'Invalid language selected'),
});

/**
 * @description Complete the initial user onboarding process
 * @param {string} fullName - The user's full name.
 * @param {string} language - The user's preferred language ('en-US' or 'pt-BR').
 * @returns {object} 200 - User profile updated
 * @returns {object} 400 - Invalid input
 * @returns {object} 401 - Unauthorized
 */
app.post(
  '/onboarding',
  // TODO: Add middleware to get authenticated user ID
  zValidator('json', OnboardingSchema),
  async (c) => {
    const { fullName, language } = c.req.valid('json');
    const userId = c.get('userId'); // Assumes middleware provides this

    await db
      .update(userProfiles)
      .set({ fullName, language, updatedAt: new Date() })
      .where(eq(userProfiles.id, userId));

    return c.json({ message: 'Onboarding completed successfully' });
  }
);

export default app;
```
