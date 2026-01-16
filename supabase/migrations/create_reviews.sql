-- General reviews table to support restaurant, waiter, and dish reviews
DROP TYPE IF EXISTS review_target CASCADE;
CREATE TYPE review_target AS ENUM ('restaurant', 'waiter', 'dish');

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  target_type review_target NOT NULL,
  target_id UUID, -- references dishes.id when type=dish, orders.id or profiles.id for waiter (flexible)
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reviews_target ON reviews(target_type);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Owners can view/manage reviews
CREATE POLICY "Owners can manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = reviews.restaurant_id AND r.owner_id = auth.uid()
    )
  );

-- Public can insert (client side will be scoped via API and tokens)
CREATE POLICY "Public can insert reviews" ON reviews
  FOR INSERT WITH CHECK (true);
