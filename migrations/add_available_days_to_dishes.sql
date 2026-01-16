-- Migration: Add available_days to dishes table
-- Allows dishes to be available only on specific days of the week
-- Array of integers: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday

ALTER TABLE dishes ADD COLUMN IF NOT EXISTS available_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6];

COMMENT ON COLUMN dishes.available_days IS 'Array of week days (0-6) when dish is available. NULL or empty means available all days';
