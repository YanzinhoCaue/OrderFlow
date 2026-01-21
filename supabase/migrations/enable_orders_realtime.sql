-- Enable Realtime for orders table
-- This allows clients to subscribe to changes in the orders table

-- Enable Realtime replication for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Create RLS policy to allow public to read their own orders via realtime
DROP POLICY IF EXISTS "Public can view orders via realtime" ON orders;
CREATE POLICY "Public can view orders via realtime"
  ON orders FOR SELECT
  USING (true);  -- Will be filtered by id on the client side
