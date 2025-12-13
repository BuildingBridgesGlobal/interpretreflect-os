-- Fix Vimeo video URL to include privacy hash for unlisted video
-- The video is private/unlisted and requires the ?h= parameter to load

-- Already applied via direct database update on 2025-12-13
-- UPDATE skill_modules
-- SET video_url = 'https://player.vimeo.com/video/1093410263?h=590c0ec411'
-- WHERE module_code = 'CEU-2025-VS001'
--   AND video_url = 'https://player.vimeo.com/video/1093410263';
