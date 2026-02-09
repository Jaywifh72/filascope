-- Create storage bucket for static images
INSERT INTO storage.buckets (id, name, public)
VALUES ('static-images', 'static-images', true);

-- Allow public read access to all objects in static-images bucket
CREATE POLICY "Public read access for static images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'static-images');

-- Allow authenticated uploads (for the migration edge function)
CREATE POLICY "Authenticated upload to static images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'static-images' AND auth.role() = 'authenticated');

-- Allow service role full access (for edge function uploads)
CREATE POLICY "Service role full access to static images"
ON storage.objects
FOR ALL
USING (bucket_id = 'static-images')
WITH CHECK (bucket_id = 'static-images');