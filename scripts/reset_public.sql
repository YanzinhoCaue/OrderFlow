-- Reset completo das tabelas e tipos do schema "public" da aplicação
-- Seguro para projetos Supabase: não toca nos schemas "auth" e "storage"
-- ATENÇÃO: Isto apaga TODOS os dados das tabelas da aplicação.

BEGIN;

-- Drop tabelas (ordem respeitando dependências) + CASCADE para políticas/índices/triggers
DROP TABLE IF EXISTS order_item_ingredients CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS order_status_history CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS tables CASCADE;
DROP TABLE IF EXISTS dish_images CASCADE;
DROP TABLE IF EXISTS dish_ingredients CASCADE;
DROP TABLE IF EXISTS dishes CASCADE;
DROP TABLE IF EXISTS ingredients CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop enum/tipos usados
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    DROP TYPE order_status;
  END IF;
END $$;

COMMIT;

-- Alternativa mais agressiva (NÃO recomendada se você tem objetos no schema public fora da app):
-- DROP SCHEMA public CASCADE; CREATE SCHEMA public;
-- GRANT USAGE, CREATE ON SCHEMA public TO postgres, public;