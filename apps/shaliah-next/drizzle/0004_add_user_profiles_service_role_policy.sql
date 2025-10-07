-- Add service role policy for user_profiles
-- This allows the bot (using service role) to update user profiles

-- Service role can read all user profiles (for bot operations)
CREATE POLICY "Service role can read all profiles" ON user_profiles
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');

-- Service role can update all user profiles (for bot linking)
CREATE POLICY "Service role can update all profiles" ON user_profiles
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'service_role');
