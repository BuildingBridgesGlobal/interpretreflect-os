-- ============================================
-- POST IMAGES SUPPORT
-- ============================================
-- Add image_url column to community_posts and set up storage

-- Add image_url column to community_posts
ALTER TABLE community_posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for post images (run this in Supabase Dashboard if it fails)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for post-images bucket
-- Note: These need to be run in Supabase Dashboard SQL editor

-- Allow authenticated users to upload images
-- CREATE POLICY "Authenticated users can upload post images"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'post-images'
--   AND auth.role() = 'authenticated'
-- );

-- Allow anyone to view post images (public bucket)
-- CREATE POLICY "Anyone can view post images"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'post-images');

-- Allow users to delete their own images
-- CREATE POLICY "Users can delete own post images"
-- ON storage.objects FOR DELETE
-- USING (
--   bucket_id = 'post-images'
--   AND auth.uid()::text = (storage.foldername(name))[1]
-- );
