-- ========================================
-- ADICIONAR PERMISSÃO DE DELETE EM NOTIFICAÇÕES
-- ========================================

-- Criar política para permitir que todos deletem notificações
DROP POLICY IF EXISTS "Enable delete for all users" ON notifications;
CREATE POLICY "Enable delete for all users"
ON notifications FOR DELETE
USING (true);

-- Verificar se a política foi criada
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'notifications'
  AND cmd = 'DELETE';

SELECT '✅ Política DELETE criada com sucesso!' as status;
