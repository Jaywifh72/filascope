-- Enable REPLICA IDENTITY FULL for realtime with RLS to work properly
-- This allows realtime updates to include all columns for proper filtering
ALTER TABLE public.scrape_jobs REPLICA IDENTITY FULL;