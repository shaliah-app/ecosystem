-- Enable RLS on auth_tokens table
ALTER TABLE auth_tokens ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for auth_tokens
-- Users can view their own tokens
CREATE POLICY "Users can view their own tokens" ON auth_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert tokens for themselves
CREATE POLICY "Users can insert their own tokens" ON auth_tokens
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own tokens" ON auth_tokens
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role can read all tokens (for bot validation)
CREATE POLICY "Service role can read all tokens" ON auth_tokens
  FOR SELECT USING (auth.jwt() ->> 'role' = 'service_role');