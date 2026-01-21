-- Migration: Create order_item_ingredients table if not exists
-- Description: Stores ingredient customizations for order items

CREATE TABLE IF NOT EXISTS order_item_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  was_added BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_order_item_ingredients_item'
  ) THEN
    CREATE INDEX idx_order_item_ingredients_item ON order_item_ingredients(order_item_id);
  END IF;
END $$;

-- Enable RLS
ALTER TABLE order_item_ingredients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Restaurant owners can view order item ingredients" ON order_item_ingredients;
CREATE POLICY "Restaurant owners can view order item ingredients"
  ON order_item_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE oi.id = order_item_id
      AND r.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Restaurant owners can insert order item ingredients" ON order_item_ingredients;
CREATE POLICY "Restaurant owners can insert order item ingredients"
  ON order_item_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN restaurants r ON o.restaurant_id = r.id
      WHERE oi.id = order_item_id
      AND r.owner_id = auth.uid()
    )
  );

-- Allow service role to bypass RLS
DROP POLICY IF EXISTS "Service role can manage order item ingredients" ON order_item_ingredients;
CREATE POLICY "Service role can manage order item ingredients"
  ON order_item_ingredients FOR ALL
  USING (true)
  WITH CHECK (true);
