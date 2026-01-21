# Debugar Notificações do Cliente

## Problema
As notificações não estão chegando para o cliente no MenuPageClient.

## Solução Implementada

### 1. **Persistência do Order ID**
- ✅ Agora salva `lastOrderId` no `localStorage`
- ✅ Recupera ao carregar a página (persiste entre recargas)
- ✅ Permite que o cliente receba notificações mesmo depois de recarregar

### 2. **Logs Melhorados**
Abra o Console do Navegador (F12) e procure por:
```
📦 Pedido criado! ID: [uuid]
🔌 Conectando ao Realtime para pedido: [uuid]
🔌 Realtime status: [SUBSCRIBED/CLOSED/etc]
📨 Atualização recebida: [payload]
Status mudou: pending → in_preparation
✅ Notificação aceito enviada
```

## Passos para Testar

### Teste 1: Verificar se o pedido está sendo salvo
1. Fazer um pedido
2. Abrir Console (F12) → Aba "Console"
3. Procurar por: `📦 Pedido criado! ID:`
4. Verificar se tem um ID UUID (ex: `a1b2c3d4-e5f6-7890-1234-567890abcdef`)

### Teste 2: Verificar se está conectando ao Realtime
1. Na mesma aba Console, procurar por: `🔌 Conectando ao Realtime`
2. Procurar por: `🔌 Realtime status: SUBSCRIBED`
3. Se aparecer `CLOSED` ou erro, significa que não conectou

### Teste 3: Verificar se recebe atualização
1. Fazer um pedido na página do cliente
2. Na cozinha, clicar em "Aceitar" dentro de 30 segundos
3. No Console do cliente, procurar por:
   - `📨 Atualização recebida:`
   - `Status mudou: pending → in_preparation`
   - `✅ Notificação aceito enviada`

## Se não funcionar:

### Verificação 1: Realtime está habilitado?
Execute no Supabase SQL Editor:
```sql
SELECT * FROM pg_publication;
```
Procure por `supabase_realtime` na lista

Se não existir ou `orders` não estiver incluído, execute:
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

### Verificação 2: RLS policies estão corretos?
Execute:
```sql
SELECT * FROM pg_policies WHERE tablename = 'orders';
```

Deve ter policies que permitem INSERT/SELECT/UPDATE em `orders`.

### Verificação 3: Cliente está autenticado?
No Console:
```javascript
const { data: { user } } = await supabase.auth.getUser()
console.log(user)
```

Deve mostrar um objeto com email/id do usuário.

### Verificação 4: Chave ANON está correta?
Verificar `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (deve ter conteúdo)
```

## Status do Realtime

Possíveis valores no `🔌 Realtime status`:
- `SUBSCRIBED` ✅ Conectado e pronto
- `CHANNEL_ERROR` ❌ Erro no canal
- `CLOSED` ❌ Conexão fechada
- `TIMED_OUT` ❌ Timeout na conexão

## Exemplo de Payload Esperado

Quando a cozinha aceita um pedido, o cliente deve receber:
```javascript
{
  new: {
    id: "uuid-do-pedido",
    status: "in_preparation",
    ...outros_campos
  },
  old: {
    id: "uuid-do-pedido",
    status: "pending",
    ...outros_campos
  }
}
```

## Próximos Passos se ainda não funcionar

1. Verificar logs do servidor Supabase
2. Confirmar que a função `acceptOrder` está sendo chamada
3. Verificar se o status está sendo atualizado no banco de dados
4. Checar se há erro na subscrição do canal
