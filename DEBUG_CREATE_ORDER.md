# Debugar Erro: Failed to Create Order

## Como Debugar

### 1. Abra os Console Logs
- **F12** → Aba "Console" (para logs do navegador)
- **Terminal do VS Code** (para logs do servidor Next.js)

### 2. Tente criar um pedido
Procure pelos logs com esses emojis:

#### No Console do Navegador:
```
🛒 Iniciando envio do pedido...
📋 Resposta do servidor: { success: true/false, ... }
📦 Pedido criado! ID: xxxxx
❌ Erro ao criar pedido: [mensagem do erro]
💥 Error submitting order: [erro completo]
```

#### No Terminal (servidor):
```
🔧 Iniciando criação de pedido...
📍 Procurando mesa para restaurante: [ID]
📍 Resultado da busca de mesa: { tables: ..., tablesError: ... }
✅ Mesa encontrada: [ID] 
ou
🆕 Criando mesa temporária...
🆕 Mesa temporária: { newTable: ..., tableError: ... }
📝 Criando pedido com dados: { restaurant_id, table_id, customer_name, total_amount }
📝 Resposta do pedido: { order: {...}, orderError: ... }
✅ Pedido criado com ID: [UUID]
🍽️ Criando item de pedido: { dish_id, quantity, unit_price }
🍽️ Item criado: { orderItem: {...}, itemError: ... }
🥘 Inserindo ingredientes customizados: [número]
🥘 Resposta ingredientes: [erro ou null]
📜 Criando histórico de status...
✅ Pedido criado com sucesso!
```

## Possíveis Erros e Soluções

### 1. Erro ao procurar mesa
```
📍 Resultado da busca de mesa: { tables: null, tablesError: {...} }
```
**Causa**: Não há nenhuma mesa criada no restaurante  
**Solução**: Vá em Configurações → Mesas e crie uma mesa

### 2. Erro ao criar pedido
```
📝 Resposta do pedido: { order: null, orderError: "relation does not exist" }
```
**Causa**: Tabela de pedidos não existe ou RLS policy está bloqueando  
**Solução**: Verifique RLS policies no Supabase ou se a tabela `orders` existe

### 3. Erro de credenciais Supabase
```
💥 Error submitting order: {"message":"Invalid API Key"}
```
**Causa**: `SUPABASE_SERVICE_ROLE_KEY` inválida no `.env`  
**Solução**: Verifique `.env.local` e regenere a chave se necessário

### 4. Erro ao criar item de pedido
```
🍽️ Item criado: { orderItem: null, itemError: {...} }
```
**Causa**: O `dish_id` é inválido ou não existe  
**Solução**: Verifique se o prato realmente existe no banco

### 5. Erro em ingredientes
```
🥘 Resposta ingredientes: {"message":"..."}
```
**Causa**: Estrutura de ingredientes incorreta  
**Solução**: Verifique a tabela `order_item_ingredients` no Supabase

## Próximos Passos

1. Abra o console (F12)
2. Tente criar um pedido
3. Copie todos os logs com emojis (🛒, 📋, 💥, 🔧, 📍, etc)
4. Compartilhe comigo quais aparecem
5. Vou ajudar a resolver baseado nos logs!

## Checklist Rápido

- [ ] Restaurante tem pelo menos uma mesa?
- [ ] `.env.local` tem `SUPABASE_SERVICE_ROLE_KEY` válida?
- [ ] Tabela `orders` existe no Supabase?
- [ ] RLS policies estão habilitadas?
- [ ] Servidor Next.js está rodando (npm run dev)?
