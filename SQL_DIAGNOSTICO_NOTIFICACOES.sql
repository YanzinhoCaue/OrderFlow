-- ========================================
-- SCRIPT DE DIAGNÓSTICO - REALTIME E RLS
-- ========================================

-- 1. Verificar se há notificações no banco
SELECT 
  'Total de notificações' as check_type,
  COUNT(*) as count
FROM notifications;

-- 2. Ver últimas notificações criadas
SELECT 
  'Últimas notificações' as check_type,
  id,
  target,
  type,
  message,
  order_id,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- 3. Verificar políticas RLS na tabela notifications
SELECT 
  'Políticas RLS' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'notifications';

-- 4. Verificar se RLS está habilitado
SELECT 
  'RLS Status' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'notifications';

-- ========================================
-- CORREÇÕES NECESSÁRIAS
-- ========================================

-- Se não houver política de SELECT, crie uma:
-- DESCOMENTE E EXECUTE:

/*
CREATE POLICY "Enable read access for all users"
ON notifications FOR SELECT
USING (true);
*/

-- Se não houver política de INSERT para autenticados, crie uma:
-- DESCOMENTE E EXECUTE:

/*
CREATE POLICY "Enable insert for authenticated users only"
ON notifications FOR INSERT
WITH CHECK (true);
*/

-- ========================================
-- TESTE DE INSERÇÃO MANUAL
-- ========================================

-- Insira uma notificação de teste (substitua os IDs):
-- DESCOMENTE E EXECUTE (SUBSTITUA OS IDs REAIS):

/*
INSERT INTO notifications (
  restaurant_id,
  table_id,
  order_id,
  target,
  type,
  message
) VALUES (
  '191a8d92-302f-428f-84ff-50745afba50f', -- ID do seu restaurante
  (SELECT id FROM tables LIMIT 1), -- Primeira mesa
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1), -- Último pedido
  'customer',
  'test',
  '🧪 TESTE DE NOTIFICAÇÃO - Se você está vendo isso no Realtime, está funcionando!'
);
*/
