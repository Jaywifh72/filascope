
-- Add new columns to trending_materials for enhanced features
ALTER TABLE trending_materials 
ADD COLUMN IF NOT EXISTS why_now TEXT,
ADD COLUMN IF NOT EXISTS extended_context TEXT,
ADD COLUMN IF NOT EXISTS related_content_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS related_content_url TEXT,
ADD COLUMN IF NOT EXISTS trend_velocity TEXT DEFAULT 'rising',
ADD COLUMN IF NOT EXISTS sparkline_data JSONB DEFAULT '[{"day":1,"value":20},{"day":2,"value":35},{"day":3,"value":45},{"day":4,"value":60},{"day":5,"value":75},{"day":6,"value":85},{"day":7,"value":100}]',
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_prediction BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prediction_reason TEXT;

-- Create trend_upvotes table for user contributions
CREATE TABLE IF NOT EXISTS trend_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trend_id UUID REFERENCES trending_materials(id) ON DELETE CASCADE,
  user_id UUID,
  anonymous_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(trend_id, user_id),
  UNIQUE(trend_id, anonymous_id)
);

-- Enable RLS on trend_upvotes
ALTER TABLE trend_upvotes ENABLE ROW LEVEL SECURITY;

-- Public can read upvote counts (aggregated in trending_materials)
CREATE POLICY "Upvotes publicly readable" ON trend_upvotes FOR SELECT USING (true);

-- Anyone can insert upvotes
CREATE POLICY "Anyone can upvote" ON trend_upvotes FOR INSERT WITH CHECK (true);

-- Update existing trending materials with enhanced data
UPDATE trending_materials SET
  why_now = 'Outdoor printing season is here',
  extended_context = 'Makers preparing patio furniture and garden accessories',
  related_content_count = 12,
  related_content_url = '/?material=ASA',
  trend_velocity = 'rising_fast',
  sparkline_data = '[{"day":1,"value":15},{"day":2,"value":25},{"day":3,"value":40},{"day":4,"value":55},{"day":5,"value":70},{"day":6,"value":85},{"day":7,"value":100}]',
  upvote_count = 47
WHERE title = 'ASA-CF Rising for Outdoor Prints';

UPDATE trending_materials SET
  why_now = 'Miniature painting community growth',
  extended_context = 'Popular for tabletop gaming and cosplay props',
  related_content_count = 8,
  related_content_url = '/?material=PLA',
  trend_velocity = 'steady',
  sparkline_data = '[{"day":1,"value":45},{"day":2,"value":50},{"day":3,"value":55},{"day":4,"value":62},{"day":5,"value":68},{"day":6,"value":75},{"day":7,"value":82}]',
  upvote_count = 23
WHERE title = 'Matte PLA Finishes';

UPDATE trending_materials SET
  why_now = 'Budget-friendly engineering plastic',
  extended_context = 'Great alternative to ABS with easier printing',
  related_content_count = 15,
  related_content_url = '/?material=PETG',
  trend_velocity = 'rising',
  sparkline_data = '[{"day":1,"value":30},{"day":2,"value":38},{"day":3,"value":45},{"day":4,"value":55},{"day":5,"value":65},{"day":6,"value":72},{"day":7,"value":80}]',
  upvote_count = 31
WHERE title = 'PETG for Functional Parts';

-- Add a prediction trend
INSERT INTO trending_materials (title, description, material_filter, context, is_active, is_prediction, prediction_reason, position)
VALUES (
  'Glow-in-Dark PLA',
  'Seasonal prediction',
  'PLA',
  'for holiday decorations',
  true,
  true,
  'Holiday decoration season approaching',
  10
) ON CONFLICT DO NOTHING;
