-- Create storage bucket for filament images
INSERT INTO storage.buckets (id, name, public)
VALUES ('filament-images', 'filament-images', true);

-- Enable public access to filament images
CREATE POLICY "Filament images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'filament-images');

-- Allow admins to upload filament images
CREATE POLICY "Admins can upload filament images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'filament-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update filament images
CREATE POLICY "Admins can update filament images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'filament-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete filament images
CREATE POLICY "Admins can delete filament images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'filament-images' 
  AND has_role(auth.uid(), 'admin'::app_role)
);