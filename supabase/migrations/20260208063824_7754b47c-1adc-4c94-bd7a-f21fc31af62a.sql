-- Add foreign key from community_photos.user_id to profiles.id for join support
ALTER TABLE public.community_photos
  ADD CONSTRAINT community_photos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id);
