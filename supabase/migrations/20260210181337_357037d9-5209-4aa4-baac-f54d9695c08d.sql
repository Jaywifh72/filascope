
-- Create brand-logos storage bucket for optimized logo images
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Brand logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-logos');

-- Allow authenticated users (admins) to upload
CREATE POLICY "Admins can upload brand logos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update brand logos
CREATE POLICY "Admins can update brand logos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'brand-logos' AND auth.role() = 'authenticated');
