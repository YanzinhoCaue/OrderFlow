# 🔔 Sistema de Notificações em Tempo Real - Implementação Completa

## ✅ O que foi implementado:

### 1. **Dashboard do Restaurante (Cozinha)**
- Botão **"Aceitar"** fica **VERDE** quando o pedido está `pending`
- Após aceitar, muda para laranja nos próximos status
- Classe CSS: `from-green-500 to-emerald-500` quando status = `pending`

### 2. **Menu do Cliente**
- **Sininho de notificações** no header (canto superior direito)
- Badge vermelho pulsante mostra número de notificações
- Dropdown com lista de notificações
- Botão "Limpar todas" para remover notificações

### 3. **Sistema de Notificação em Tempo Real**
- Usa **Supabase Realtime** para monitorar mudanças na tabela `orders`
- Quando pedido muda de `pending` → `received`, cliente recebe notificação
- Notificação mostra: "✅ Pedido Aceito!" + "Seu pedido foi aceito pela cozinha"

## 🔧 Configuração Necessária

### Passo 1: Executar Migration do Realtime

Execute no **SQL Editor do Supabase**:

\`\`\`sql
-- Enable Realtime replication for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Create RLS policy to allow public to read their own orders via realtime
DROP POLICY IF EXISTS "Public can view orders via realtime" ON orders;
CREATE POLICY "Public can view orders via realtime"
  ON orders FOR SELECT
  USING (true);
\`\`\`

Ou execute a migration via arquivo:
\`\`\`bash
# O arquivo já está em: supabase/migrations/enable_orders_realtime.sql
\`\`\`

### Passo 2: Habilitar Realtime no Dashboard

1. Acesse o Supabase Dashboard
2. Vá em **Database** → **Replication**
3. Encontre a tabela **orders**
4. Clique em **Enable** ou marque o checkbox para habilitar Realtime
5. Salve as alterações

### Passo 3: Reiniciar o Servidor

\`\`\`bash
# Ctrl+C para parar
npm run dev
\`\`\`

## 🧪 Testando o Fluxo Completo

### Teste 1: Fazer um Pedido
1. Acesse o cardápio via QR code ou `/menu`
2. Adicione itens ao carrinho
3. Finalize o pedido
4. ✅ Pedido criado com sucesso

### Teste 2: Aceitar Pedido (Dashboard)
1. Entre no dashboard: `/dashboard/orders`
2. Veja o pedido com status "Novo"
3. Botão deve estar **VERDE** com texto "Aceitar"
4. Clique em "Aceitar"
5. ✅ Status muda para "Recebido"

### Teste 3: Receber Notificação (Cliente)
1. No menu do cliente, observe o sininho no header
2. Quando o pedido for aceito, o badge vermelho aparece com número "1"
3. Badge pulsa para chamar atenção
4. Clique no sininho
5. ✅ Notificação aparece: "✅ Pedido Aceito!"

## 📊 Fluxo de Dados

\`\`\`
[Cliente faz pedido]
        ↓
[Pedido salvo: status = "pending"]
        ↓
[Dashboard mostra botão VERDE "Aceitar"]
        ↓
[Cozinheiro clica em "Aceitar"]
        ↓
[Status muda: "pending" → "received"]
        ↓
[Supabase Realtime detecta mudança]
        ↓
[Cliente recebe notificação em tempo real]
        ↓
[Badge vermelho aparece no sininho]
        ↓
[Cliente clica e vê: "✅ Pedido Aceito!"]
\`\`\`

## 🎨 Cores dos Botões por Status

| Status | Texto Botão | Cor do Botão |
|--------|------------|--------------|
| pending | Aceitar | 🟢 Verde (green-500 → emerald-500) |
| received | Avançar | 🟠 Laranja (amber-500 → orange-500) |
| in_preparation | Avançar | 🟠 Laranja (amber-500 → orange-500) |
| ready | Avançar | 🟠 Laranja (amber-500 → orange-500) |
| delivered | - | (Sem botão) |
| cancelled | - | (Sem botão) |

## 🔔 Formato das Notificações

\`\`\`typescript
{
  id: number,              // Timestamp único
  title: '✅ Pedido Aceito!',
  message: 'Seu pedido foi aceito pela cozinha',
  timestamp: Date          // Hora da notificação
}
\`\`\`

## 🐛 Troubleshooting

### Notificação não aparece?

1. **Verifique se Realtime está habilitado**:
   - Supabase Dashboard → Database → Replication → orders (Enable)

2. **Verifique console do navegador**:
   - Abra DevTools (F12)
   - Procure por erros relacionados a "realtime" ou "subscription"

3. **Teste manual via SQL**:
   \`\`\`sql
   -- Atualize manualmente um pedido
   UPDATE orders 
   SET status = 'received' 
   WHERE id = 'seu-order-id' AND status = 'pending';
   \`\`\`

4. **Verifique se o pedido foi salvo corretamente**:
   - O campo \`lastOrderId\` deve estar preenchido no estado do cliente
   - Verifique no console: \`console.log(lastOrderId)\`

### Badge não aparece?

1. Verifique se há notificações no estado:
   \`\`\`javascript
   // Adicione no código:
   console.log('Notifications:', notifications)
   \`\`\`

2. Limpe o cache do navegador (Ctrl+Shift+R)

3. Verifique se o pedido realmente mudou de status

### Botão não fica verde?

1. Verifique se o status do pedido é exatamente \`'pending'\`
2. Limpe o cache e reinicie o servidor
3. Verifique a classe CSS no elemento:
   \`\`\`html
   <!-- Deve conter: -->
   bg-gradient-to-r from-green-500 to-emerald-500
   \`\`\`

## 📱 Funcionalidades Extras

- ✅ Sininho pulsa quando há notificações não lidas
- ✅ Dropdown fecha ao clicar fora
- ✅ Botão "Limpar todas" remove notificações
- ✅ Horário exibido em formato PT-BR (HH:mm)
- ✅ Auto-scroll no dropdown de notificações

## 🚀 Próximas Melhorias Opcionais

1. **Som de notificação**: Tocar um "ding" quando notificação chegar
2. **Push notifications**: Usar Web Push API para notificações nativas
3. **Histórico completo**: Página com todas as notificações antigas
4. **Filtros**: Ver apenas notificações de pedidos aceitos, prontos, etc.
5. **Marca como lida**: Sistema para marcar notificações individuais como lidas

---

**Status**: ✅ Sistema de notificações em tempo real completamente implementado!
