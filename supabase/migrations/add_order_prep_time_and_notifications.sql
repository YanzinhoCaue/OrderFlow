-- Add prep_time_minutes to orders
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS prep_time_minutes INTEGER;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  target TEXT NOT NULL CHECK (target IN ('waiter','customer')),
  type TEXT NOT NULL CHECK (type IN ('accepted','cancelled','ready')),
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_notifications_restaurant ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_order ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies: owners manage; waiter/customer views will be scoped later
CREATE POLICY "Owners can manage notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = notifications.restaurant_id AND r.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view order notifications" ON notifications
  FOR SELECT USING (true);
