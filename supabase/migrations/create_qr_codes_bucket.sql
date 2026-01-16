-- Create bucket for QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('qr-codes', 'qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload QR codes
CREATE POLICY "Allow authenticated users to upload QR codes"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');

-- Allow authenticated users to update QR codes
CREATE POLICY "Allow authenticated users to update QR codes"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'qr-codes')
WITH CHECK (bucket_id = 'qr-codes');

-- Allow public access to view QR codes
CREATE POLICY "Allow public to read QR codes"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'qr-codes');

-- Allow authenticated users to delete QR codes
CREATE POLICY "Allow authenticated users to delete QR codes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'qr-codes');
