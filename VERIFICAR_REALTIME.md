# ⚠️ Verificação de Realtime - Notificações

## Problema Identificado
As notificações não estão chegando para o cliente quando:
1. Cliente faz pedido → Cozinha não recebe notificação
2. Cozinha aceita pedido → Cliente não recebe notificação

## O que verificar no Supabase:

### 1. ✅ Habilitar Realtime na tabela `notifications`

Acesse: **Supabase Dashboard → Database → Replication**

Verifique se a tabela `notifications` está com Realtime **HABILITADO**:
- [ ] Source: `notifications` 
- [ ] Status: **Enabled**

**Se não estiver habilitado:**
1. Clique em "Add table"
2. Selecione `notifications`
3. Clique em "Enable"

### 2. ✅ Verificar RLS (Row Level Security)

Acesse: **Supabase Dashboard → Authentication → Policies**

A tabela `notifications` precisa ter políticas que permitam:
- **INSERT**: Permitir que server crie notificações
- **SELECT**: Permitir que todos leiam notificações (para Realtime)

**Criar política de SELECT:**
```sql
-- Política para permitir leitura de notificações
CREATE POLICY "Anyone can read notifications"
ON notifications FOR SELECT
USING (true);

-- OU se quiser restringir por restaurante:
CREATE POLICY "Read notifications for restaurant"
ON notifications FOR SELECT
USING (
  restaurant_id IN (
    SELECT id FROM restaurants WHERE id = restaurant_id
  )
);
```

### 3. ✅ Logs do Servidor

Para ver os logs do backend (acceptOrder, submitMenuOrder):
- Abra o **Terminal** onde você executou `npm run dev`
- Os logs aparecem lá, NÃO no console do navegador

### 4. 🧪 Teste Manual

Execute este código no console do navegador (página do cliente):

```javascript
// Teste de conexão Realtime
const { createClient } = await import('@supabase/supabase-js')
const supabase = createClient(
  'https://fvuhyailytnfmseesdfr.supabase.co',
  'sb_publishable_z6WZcvrPSuoiyjeYbOD6Sg_Z5IwZJHn'
)

const channel = supabase
  .channel('test-notifications')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications'
  }, (payload) => {
    console.log('🎉 NOTIFICAÇÃO RECEBIDA:', payload)
  })
  .subscribe((status) => {
    console.log('Status:', status)
  })
```

### 5. 🔍 Verificar se notificações estão sendo criadas

Execute no **SQL Editor** do Supabase:

```sql
-- Ver últimas notificações criadas
SELECT 
  id,
  target,
  type,
  message,
  order_id,
  created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 10;
```

Se as notificações **existem** no banco mas **não chegam** via Realtime:
→ Problema de Realtime/RLS

Se as notificações **NÃO existem** no banco:
→ Problema na criação (ver logs do servidor)

## ✅ Checklist

- [ ] Realtime habilitado na tabela `notifications`
- [ ] Política RLS permite SELECT em `notifications`
- [ ] Logs do servidor rodando e visíveis no terminal
- [ ] Notificações sendo criadas no banco de dados
- [ ] Cliente conectado ao Realtime (status SUBSCRIBED)
