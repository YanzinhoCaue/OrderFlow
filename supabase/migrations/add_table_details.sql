-- Add new columns to tables
ALTER TABLE tables 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS seats_count INTEGER DEFAULT 4;

-- Add comment
COMMENT ON COLUMN tables.description IS 'Optional description of the table location or features';
COMMENT ON COLUMN tables.image_url IS 'Optional image URL of the table';
COMMENT ON COLUMN tables.seats_count IS 'Number of seats available at the table';
