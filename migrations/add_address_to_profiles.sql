-- Add address column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_address ON profiles(address);
