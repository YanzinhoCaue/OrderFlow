# Debug do Erro - Próximas Ações

## Como Proceder

1. **Reinicie o servidor:**
   ```bash
   npm run dev
   ```

2. **Abra o navegador:** http://localhost:3000/qr

3. **Pressione F12** e vá à aba **Console**

4. **Tente criar um pedido**

5. **Copie TODOS os logs que aparecerem** no console e no terminal

## Logs que Você Verá

### No Terminal (servidor):
```
🔐 Verificando variáveis de ambiente:
✓ NEXT_PUBLIC_SUPABASE_URL: definida
✓ SUPABASE_SERVICE_ROLE_KEY: definida (comprimento: XXX)
🔧 Iniciando criação de pedido...
✅ Cliente Supabase criado com sucesso
📍 Procurando mesa para restaurante: [ID]
...
```

### No Console (navegador):
```
🛒 Iniciando envio do pedido...
📋 Resposta do servidor: { success: false, error: "..." }
❌ Erro ao criar pedido: ...
```

## Envie Para Mim

1. Captura de tela do console (F12) com os logs
2. Captura de tela do terminal com os logs
3. A mensagem de erro específica

**Você pode usar:** Print Screen → Colar em um editor de imagem → Salvar

Ou simplesmente **copiar o texto** e mandar por aqui mesmo!

Com esses logs consigo identificar exatamente o problema! 🔍
