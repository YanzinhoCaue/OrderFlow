-- ============================================
-- TESTE: Validar Realtime de Notificações do Cliente
-- ============================================

-- 1. VERIFICAR SE AS POLÍTICAS RLS ESTÃO CONFIGURADAS CORRETAMENTE
-- Executar como admin/superuser

-- Verificar política de notificações
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY policyname;

-- Esperado:
-- - "Owners can manage notifications" (para proprietários)
-- - "Public can view order notifications" (para todos, inclusive clientes anônimos)

-- 2. VERIFICAR SE A TABELA NOTIFICATIONS ESTÁ HABILITADA PARA REALTIME
SELECT 
  publication,
  schemaname,
  tablename
FROM pg_publication_tables
WHERE publication = 'supabase_realtime'
ORDER BY tablename;

-- Esperado: 'notifications' deve estar listado junto com 'orders' e outras tabelas

-- 3. VERIFICAR NOTIFICAÇÕES RECENTES POR ORDER_ID
-- Use este query para testar se as notificações estão sendo criadas corretamente

SELECT 
  n.id,
  n.order_id,
  n.target,
  n.type,
  n.message,
  n.created_at,
  o.order_number,
  o.customer_name,
  o.status
FROM notifications n
LEFT JOIN orders o ON o.id = n.order_id
WHERE n.created_at > NOW() - INTERVAL '1 hour'
ORDER BY n.created_at DESC
LIMIT 20;

-- 4. VERIFICAR SE ESTÁ CRIANDO NOTIFICAÇÕES COM TARGET='customer'
SELECT 
  target,
  COUNT(*) as count,
  type,
  MAX(created_at) as latest
FROM notifications
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY target, type
ORDER BY target, type;

-- Esperado:
-- target='customer' com múltiplos tipos (accepted, ready, cancelled)
-- target='waiter' com múltiplos tipos
-- target='kitchen' com múltiplos tipos

-- 5. TESTE MANUAL: Criar uma notificação e verificar se é recebida
-- Execute após criar um pedido:

-- Simular criação de notificação de cliente
INSERT INTO notifications (
  restaurant_id,
  table_id, 
  order_id,
  target,
  type,
  message
) VALUES (
  'YOUR_RESTAURANT_ID',  -- Substituir com ID real
  'YOUR_TABLE_ID',       -- Substituir com ID real
  'YOUR_ORDER_ID',       -- Substituir com ID real
  'customer',
  'accepted',
  'Seu pedido foi aceito! Tempo de preparo: 15 minutos'
);

-- 6. VALIDAR POLÍTICAS DE RLS NA TABELA ORDERS (para fallback)
SELECT 
  policyname, 
  permissive,
  qual
FROM pg_policies 
WHERE tablename = 'orders'
ORDER BY policyname;

-- 7. TESTAR ACESSO COMO USUÁRIO ANÔNIMO (simular cliente)
-- Este query simula como um usuário não autenticado veria os dados
-- (execute em sessão separada sem JWT)

SET ROLE anon;
SELECT * FROM notifications WHERE target = 'customer' LIMIT 5;
SET ROLE postgres;  -- Voltar ao admin

-- Se der erro de permissão, a política RLS está muito restritiva
