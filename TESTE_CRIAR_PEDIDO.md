# Teste de Criação de Pedido

## Checklist Antes de Testar

- [ ] Você tem pelo menos uma mesa criada no restaurante?
- [ ] O servidor está rodando? (`npm run dev`)
- [ ] Você pode acessar http://localhost:3000?

## Como Testar

### Passo 1: Verificar Mesas
1. Abra o dashboard: http://localhost:3000/dashboard
2. Vá em "Mesas"
3. Veja se tem alguma mesa criada

**Se não tiver mesa:**
- Crie uma usando o botão "Adicionar Mesa"
- Ou deixe a função criar uma automaticamente (Balcão/Delivery)

### Passo 2: Criar Pedido
1. Abra o QR code: http://localhost:3000/qr
2. Escaneie a mesa (ou copie o link da mesa)
3. Selecione um prato
4. Adicione ao carrinho
5. Clique em "Finalizar Pedido"

### Passo 3: Monitorar Logs

**Terminal (servidor):**
```
🔧 Iniciando criação de pedido...
📍 Procurando mesa para restaurante: [ID]
📍 Resultado da busca de mesa: { tables: [...] ou [], tablesError: null }
✅ Mesa encontrada: [ID] OU 🆕 Criando mesa temporária...
📝 Criando pedido com dados: {...}
✅ Pedido criado com sucesso!
```

**Console do Navegador (F12):**
```
🛒 Iniciando envio do pedido...
📋 Resposta do servidor: { success: true, data: {...} }
📦 Pedido criado! ID: [UUID]
```

## Possíveis Problemas e Soluções

| Problema | Solução |
|----------|---------|
| `tableError: "PGRST301 No rows found"` | Crie uma mesa no restaurante |
| `orderError: "relation \"orders\" does not exist"` | Verifique se a tabela existe no Supabase |
| `Error: Invalid API Key` | Revise `.env.local` - SUPABASE_SERVICE_ROLE_KEY |
| `RLS policy violation` | Verifique RLS policies no Supabase |
| Sem logs no terminal | Servidor pode não estar rodando - `npm run dev` |

## Agora Tente!

Teste agora e veja se o pedido foi criado! 🚀
