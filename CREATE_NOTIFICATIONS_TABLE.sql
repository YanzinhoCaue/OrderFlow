-- ========================================
-- CRIAR TABELA DE NOTIFICAÇÕES
-- ========================================

-- 1. Criar tabela notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  target TEXT NOT NULL CHECK (target IN ('customer', 'waiter', 'kitchen')),
  type TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_notifications_order_id ON notifications(order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_restaurant_id ON notifications(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_target ON notifications(target);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- 3. Habilitar RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas RLS

-- Permitir leitura para todos (necessário para Realtime)
DROP POLICY IF EXISTS "Enable read access for all users" ON notifications;
CREATE POLICY "Enable read access for all users"
ON notifications FOR SELECT
USING (true);

-- Permitir inserção para usuários autenticados
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON notifications;
CREATE POLICY "Enable insert for authenticated users"
ON notifications FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Permitir inserção via service role (para criar do backend)
DROP POLICY IF EXISTS "Enable insert for service role" ON notifications;
CREATE POLICY "Enable insert for service role"
ON notifications FOR INSERT
WITH CHECK (true);

-- Permitir atualização para marcar como lido
DROP POLICY IF EXISTS "Enable update for all users" ON notifications;
CREATE POLICY "Enable update for all users"
ON notifications FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;

-- ========================================
-- VERIFICAÇÃO
-- ========================================

-- Verificar se a tabela foi criada
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'notifications';

-- Verificar se Realtime está habilitado
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'notifications';

-- ========================================
-- TESTE - Inserir notificação de exemplo
-- ========================================

-- Insira uma notificação de teste (substitua os IDs pelos seus):
/*
INSERT INTO notifications (
  restaurant_id,
  table_id,
  order_id,
  target,
  type,
  message
) VALUES (
  (SELECT id FROM restaurants LIMIT 1),
  (SELECT id FROM tables LIMIT 1),
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1),
  'customer',
  'test',
  '🎉 TESTE: Se você vê isso no cliente, as notificações estão funcionando!'
);
*/

SELECT '✅ Tabela notifications criada com sucesso!' as status;
