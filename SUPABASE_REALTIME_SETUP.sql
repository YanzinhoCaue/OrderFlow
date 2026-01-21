-- ==============================================================================
-- VERIFICAR E HABILITAR SUPABASE REALTIME PARA A TABELA ORDERS
-- ==============================================================================
-- Copie e execute estes comandos no SQL Editor do Supabase

-- 1. Verificar se a publicação 'supabase_realtime' existe
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- 2. Verificar se a tabela 'orders' está incluída na publicação
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'orders';

-- Se a tabela NÃO está na publicação, execute:
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ==============================================================================
-- VERIFICAR RLS POLICIES
-- ==============================================================================

-- 3. Verificar policies na tabela 'orders'
SELECT * FROM pg_policies WHERE tablename = 'orders';

-- Deve ter algo parecido com isto:
-- SELECT: Permite usuários verem seus próprios pedidos
-- UPDATE: Permite cozinha/garçom atualizar status

-- Se não existirem, criar as policies:

-- Permitir que o cliente veja seus próprios pedidos
CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (auth.uid()::text = customer_id);

-- Permitir que admin/kitchen atualize status
CREATE POLICY "Service role can update orders" ON public.orders
  FOR UPDATE USING (true);

-- ==============================================================================
-- VERIFICAR ESTRUTURA DA TABELA
-- ==============================================================================

-- 4. Verificar colunas da tabela 'orders'
\d public.orders

-- 5. Verificar se há dados
SELECT COUNT(*) FROM public.orders;

-- ==============================================================================
-- VERIFICAR NOTIFICAÇÕES
-- ==============================================================================

-- 6. Verificar se as notificações estão sendo criadas
SELECT COUNT(*) FROM public.notifications;
SELECT * FROM public.notifications ORDER BY created_at DESC LIMIT 5;

-- 7. Verificar se há notificações para o cliente (não para garçom)
SELECT * FROM public.notifications 
WHERE target = 'customer' 
ORDER BY created_at DESC 
LIMIT 5;

-- ==============================================================================
-- TESTE MANUAL
-- ==============================================================================

-- 8. Se quiser simular uma atualização de pedido:
UPDATE public.orders 
SET status = 'in_preparation' 
WHERE id = 'seu-order-id-aqui';

-- Isso deve disparar a notificação no Realtime subscriber do MenuPageClient
