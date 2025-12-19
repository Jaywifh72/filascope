-- Add ai_summary column to scrape_jobs table for storing AI-generated summaries
ALTER TABLE scrape_jobs ADD COLUMN IF NOT EXISTS ai_summary JSONB DEFAULT NULL;