-- ============================================
-- PROFILE AVATARS SUPPORT
-- ============================================
-- Add avatar_url column to community_profiles and set up storage

-- Add avatar_url column to community_profiles
ALTER TABLE community_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Create storage bucket for profile avatars (run this in Supabase Dashboard if it fails)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars bucket
-- Note: These need to be run in Supabase Dashboard SQL editor

-- Allow authenticated users to upload avatars
-- CREATE POLICY "Authenticated users can upload avatars"
-- ON storage.objects FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'avatars');

-- Allow anyone to view avatars (public bucket)
-- CREATE POLICY "Anyone can view avatars"
-- ON storage.objects FOR SELECT
-- TO public
-- USING (bucket_id = 'avatars');

-- Allow users to update their own avatars
-- CREATE POLICY "Users can update own avatars"
-- ON storage.objects FOR UPDATE
-- TO authenticated
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own avatars
-- CREATE POLICY "Users can delete own avatars"
-- ON storage.objects FOR DELETE
-- TO authenticated
-- USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
