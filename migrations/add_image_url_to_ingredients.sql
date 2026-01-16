-- Migration: Add image_url to ingredients table
-- Allows ingredients to have an optional image

ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS image_url TEXT;

COMMENT ON COLUMN ingredients.image_url IS 'URL of the ingredient image (optional)';
