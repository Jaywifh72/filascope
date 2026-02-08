
-- Drop the conflicting policies and recreate them
DROP POLICY IF EXISTS "Users can delete own browse history" ON user_browse_history;
DROP POLICY IF EXISTS "Users can read own browse history by session" ON user_browse_history;
DROP POLICY IF EXISTS "Anyone can insert browse history" ON user_browse_history;

-- Recreate with correct logic
CREATE POLICY "Users can read own browse history by session"
  ON user_browse_history FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR 
    (auth.uid() IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Anyone can insert browse history"
  ON user_browse_history FOR INSERT
  WITH CHECK (
    (user_id = auth.uid()) 
    OR 
    (user_id IS NULL AND session_id IS NOT NULL)
  );

CREATE POLICY "Users can delete own browse history"
  ON user_browse_history FOR DELETE
  USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
