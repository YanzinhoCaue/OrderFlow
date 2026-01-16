-- =============================================
-- iMenuFlow - DATABASE SCHEMA
-- Run this in your Supabase SQL Editor
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  cpf_cnpj TEXT UNIQUE,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RESTAURANTS
-- =============================================

DROP TABLE IF EXISTS restaurants CASCADE;

CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  phone TEXT,
  logo_url TEXT,
  cover_url TEXT,
  theme_color TEXT DEFAULT '#FF6B6B',
  is_active BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);

-- =============================================
-- CATEGORIES & SUBCATEGORIES
-- =============================================

DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  description JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);

DROP TABLE IF EXISTS subcategories CASCADE;

CREATE TABLE subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  description JSONB,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subcategories_category ON subcategories(category_id);
CREATE INDEX idx_subcategories_restaurant ON subcategories(restaurant_id);

-- =============================================
-- DISHES (MENU ITEMS)
-- =============================================

DROP TABLE IF EXISTS dishes CASCADE;

CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  name JSONB NOT NULL,
  description JSONB,
  base_price DECIMAL(10, 2) NOT NULL CHECK (base_price >= 0),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dishes_restaurant ON dishes(restaurant_id);
CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_dishes_subcategory ON dishes(subcategory_id);

-- =============================================
-- DISH IMAGES
-- =============================================

DROP TABLE IF EXISTS dish_images CASCADE;

CREATE TABLE dish_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dish_images_dish ON dish_images(dish_id);

-- =============================================
-- INGREDIENTS
-- =============================================

DROP TABLE IF EXISTS ingredients CASCADE;

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name JSONB NOT NULL,
  price DECIMAL(10, 2) DEFAULT 0 CHECK (price >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ingredients_restaurant ON ingredients(restaurant_id);

-- =============================================
-- DISH INGREDIENTS (MANY-TO-MANY)
-- =============================================

DROP TABLE IF EXISTS dish_ingredients CASCADE;

CREATE TABLE dish_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  is_optional BOOLEAN DEFAULT true,
  is_removable BOOLEAN DEFAULT true,
  is_included_by_default BOOLEAN DEFAULT true,
  additional_price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(dish_id, ingredient_id)
);

CREATE INDEX idx_dish_ingredients_dish ON dish_ingredients(dish_id);
CREATE INDEX idx_dish_ingredients_ingredient ON dish_ingredients(ingredient_id);

-- =============================================
-- TABLES
-- =============================================

DROP TABLE IF EXISTS tables CASCADE;

CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_number TEXT NOT NULL,
  qr_code_url TEXT,
  qr_code_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, table_number)
);

CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_qr_token ON tables(qr_code_token);

-- =============================================
-- ORDERS
-- =============================================

DROP TABLE IF EXISTS orders CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

CREATE TYPE order_status AS ENUM (
  'pending',
  'received',
  'in_preparation',
  'ready',
  'delivered',
  'cancelled'
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  order_number SERIAL,
  customer_name TEXT,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

-- =============================================
-- ORDER ITEMS
-- =============================================

DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_dish ON order_items(dish_id);

-- =============================================
-- ORDER ITEM INGREDIENTS (CUSTOMIZATIONS)
-- =============================================

DROP TABLE IF EXISTS order_item_ingredients CASCADE;

CREATE TABLE order_item_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  was_added BOOLEAN DEFAULT false,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_item_ingredients_item ON order_item_ingredients(order_item_id);

-- =============================================
-- ORDER STATUS HISTORY
-- =============================================

DROP TABLE IF EXISTS order_status_history CASCADE;

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status order_status NOT NULL,
  changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON order_status_history(order_id);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subcategories_updated_at BEFORE UPDATE ON subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dishes_updated_at BEFORE UPDATE ON dishes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tables_updated_at BEFORE UPDATE ON tables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE dish_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_item_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Restaurants policies
CREATE POLICY "Owners can manage their restaurants" ON restaurants
  FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Public can view active restaurants" ON restaurants
  FOR SELECT USING (is_active = true);

-- Categories policies
CREATE POLICY "Owners can manage categories" ON categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active categories" ON categories
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = categories.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Subcategories policies
CREATE POLICY "Owners can manage subcategories" ON subcategories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = subcategories.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active subcategories" ON subcategories
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = subcategories.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Dishes policies
CREATE POLICY "Owners can manage dishes" ON dishes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = dishes.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view available dishes" ON dishes
  FOR SELECT USING (
    is_active = true AND is_available = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = dishes.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Dish images policies
CREATE POLICY "Owners can manage dish images" ON dish_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dishes
      JOIN restaurants ON restaurants.id = dishes.restaurant_id
      WHERE dishes.id = dish_images.dish_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view dish images" ON dish_images
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dishes
      JOIN restaurants ON restaurants.id = dishes.restaurant_id
      WHERE dishes.id = dish_images.dish_id 
      AND dishes.is_active = true
      AND restaurants.is_active = true
    )
  );

-- Ingredients policies
CREATE POLICY "Owners can manage ingredients" ON ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ingredients.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active ingredients" ON ingredients
  FOR SELECT USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = ingredients.restaurant_id 
      AND restaurants.is_active = true
    )
  );

-- Dish ingredients policies
CREATE POLICY "Owners can manage dish ingredients" ON dish_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM dishes
      JOIN restaurants ON restaurants.id = dishes.restaurant_id
      WHERE dishes.id = dish_ingredients.dish_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view dish ingredients" ON dish_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM dishes
      JOIN restaurants ON restaurants.id = dishes.restaurant_id
      WHERE dishes.id = dish_ingredients.dish_id 
      AND dishes.is_active = true
      AND restaurants.is_active = true
    )
  );

-- Tables policies
CREATE POLICY "Owners can manage tables" ON tables
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = tables.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active tables by QR token" ON tables
  FOR SELECT USING (is_active = true);

-- Orders policies
CREATE POLICY "Owners can manage restaurant orders" ON orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = orders.restaurant_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view own orders" ON orders
  FOR SELECT USING (true);

-- Order items policies
CREATE POLICY "Owners can view restaurant order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_items.order_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can create order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Order item ingredients policies
CREATE POLICY "Owners can view order item ingredients" ON order_item_ingredients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items
      JOIN orders ON orders.id = order_items.order_id
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE order_items.id = order_item_ingredients.order_item_id 
      AND restaurants.owner_id = auth.uid()
    )
  );

CREATE POLICY "Public can create order item ingredients" ON order_item_ingredients
  FOR INSERT WITH CHECK (true);

-- Order status history policies
CREATE POLICY "Owners can manage order status" ON order_status_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN restaurants ON restaurants.id = orders.restaurant_id
      WHERE orders.id = order_status_history.order_id 
      AND restaurants.owner_id = auth.uid()
    )
  );
