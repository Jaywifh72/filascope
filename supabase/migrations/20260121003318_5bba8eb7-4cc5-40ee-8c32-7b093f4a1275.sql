-- Create storage bucket for printer images
INSERT INTO storage.buckets (id, name, public)
VALUES ('printer-images', 'printer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view printer images (public bucket)
CREATE POLICY "Printer images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'printer-images');

-- Allow authenticated users to upload printer images
CREATE POLICY "Authenticated users can upload printer images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'printer-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update/delete their uploaded images
CREATE POLICY "Authenticated users can manage printer images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'printer-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete printer images"
ON storage.objects FOR DELETE
USING (bucket_id = 'printer-images' AND auth.role() = 'authenticated');