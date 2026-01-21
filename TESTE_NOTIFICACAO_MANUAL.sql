-- ========================================
-- TESTE MANUAL DE NOTIFICAÇÃO
-- ========================================

-- Execute este comando no SQL Editor do Supabase
-- para inserir uma notificação de teste para a cozinha

INSERT INTO notifications (
  restaurant_id,
  table_id,
  order_id,
  target,
  type,
  message
) VALUES (
  '191a8d92-302f-428f-84ff-50745afba50f', -- Seu restaurant_id
  (SELECT id FROM tables WHERE restaurant_id = '191a8d92-302f-428f-84ff-50745afba50f' LIMIT 1),
  (SELECT id FROM orders ORDER BY created_at DESC LIMIT 1), -- Último pedido
  'kitchen', -- IMPORTANTE: target é 'kitchen'
  'test',
  '🧪 TESTE MANUAL: Esta é uma notificação de teste para a cozinha!'
);

-- Depois de executar, verifique:
-- 1. No console do navegador (página da cozinha) deve aparecer:
--    🔔 [COZINHA] Notificação recebida via Realtime
-- 2. A notificação deve aparecer no sino da cozinha

-- Para verificar se a notificação foi criada:
SELECT 
  id,
  target,
  type,
  message,
  created_at
FROM notifications
WHERE target = 'kitchen'
ORDER BY created_at DESC
LIMIT 5;
