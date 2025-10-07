-- Add service role update policy for auth_tokens
-- This allows the bot (using service role) to mark tokens as used

-- Service role can update all tokens (for bot operations)
CREATE POLICY "Service role can update all tokens" ON auth_tokens
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
