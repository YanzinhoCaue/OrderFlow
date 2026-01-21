# 🔧 Correção do Erro "Failed to create order"

## 🐛 Problema Identificado

O erro ocorria porque a função `submitMenuOrder` estava tentando inserir dados nas tabelas usando o cliente Supabase normal, que passa por RLS (Row Level Security). Como clientes do cardápio não estão autenticados, as políticas RLS bloqueavam a inserção.

## ✅ Solução Implementada

### 1. Cliente Admin do Supabase
Criado `lib/supabase/admin.ts` que usa a `service_role` key para bypassar RLS:

```typescript
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    // ... config
  )
}
```

### 2. Atualização da Action
A função `submitMenuOrder` agora usa o cliente admin:

```typescript
import { createAdminClient } from '@/lib/supabase/admin'

export async function submitMenuOrder(data) {
  const supabase = createAdminClient() // ← Cliente admin
  // ... resto do código
}
```

### 3. Migration da Tabela
Criada migration em `supabase/migrations/create_order_item_ingredients.sql` para garantir que a tabela existe.

### 4. Melhor Log de Erros
Agora a mensagem de erro retorna o erro real ao invés de uma mensagem genérica.

## 🔑 Configuração Necessária

### Passo 1: Obter Service Role Key

1. Acesse o Supabase Dashboard
2. Vá em **Settings** → **API**
3. Na seção **Project API keys**, copie a chave **service_role**

⚠️ **IMPORTANTE**: A `service_role` key é secreta e tem acesso total ao banco. **NUNCA** exponha ela no código frontend ou commit no Git!

### Passo 2: Adicionar no .env.local

Crie ou edite o arquivo `.env.local` na raiz do projeto:

```env
# Copie do .env.example e adicione:
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key-aqui  # ← Nova variável
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Passo 3: Executar Migration

Se necessário, execute a migration no Supabase:

1. Vá no Supabase Dashboard → **SQL Editor**
2. Cole o conteúdo de `supabase/migrations/create_order_item_ingredients.sql`
3. Execute

Ou via CLI:

```bash
npx supabase migration up
```

### Passo 4: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
npm run dev
```

## ✅ Testando

1. Acesse o cardápio via QR code: `/qr?token=xxx`
2. Adicione itens ao carrinho
3. Finalize o pedido
4. Deve funcionar sem erros!

## 🔍 Verificação

Se o erro persistir, verifique:

1. **Variável de ambiente configurada?**
   ```bash
   # Adicione um console.log temporário em lib/supabase/admin.ts
   console.log('Service role configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
   ```

2. **Migration executada?**
   - Verifique no Supabase Dashboard se a tabela `order_item_ingredients` existe

3. **RLS configurado?**
   - A tabela deve ter RLS habilitado mas com policy que permite service_role

## 📋 Checklist

- [ ] Adicionei `SUPABASE_SERVICE_ROLE_KEY` no `.env.local`
- [ ] Reiniciei o servidor dev
- [ ] Tabela `order_item_ingredients` existe no banco
- [ ] Testei criar um pedido via cardápio
- [ ] Pedido aparece no dashboard em "Pedidos"

---

**Status**: ✅ Erro corrigido! A função agora usa cliente admin que bypassa RLS.
