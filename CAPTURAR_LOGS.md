# Capturar Logs do Erro

## Passo 1: Limpar Console
1. Abra o navegador: http://localhost:3000/qr
2. Pressione **F12** para abrir Developer Tools
3. Vá na aba **Console**
4. Clique em ícone de lixeira para limpar (ou clique direito → Clear)

## Passo 2: Tente Criar Pedido
1. Selecione um prato
2. Clique em "Finalizar Pedido"
3. Aguarde o erro aparecer

## Passo 3: Copie TODOS os Logs

No **Console do Navegador**, procure por:
```
🛒 Iniciando envio do pedido...
📋 Resposta do servidor:
❌ Erro ao criar pedido:
💥 Error submitting order:
```

**Copie TUDO que aparecer** e compartilhe comigo.

---

## Passo 4: Veja Logs do Servidor

No **Terminal** onde rodou `npm run dev`, procure por:
```
🔧 Iniciando criação de pedido...
📍 Procurando mesa...
📍 Resultado da busca...
🆕 Criando mesa...
📝 Criando pedido...
❌ Error creating menu order:
```

**Copie TUDO** que aparecer no terminal.

---

## O Que Compartilhar Comigo

Envie:

1. **Screenshot ou texto dos logs do console (F12)**
2. **Screenshot ou texto dos logs do terminal**
3. **Se possível, o erro específico (qual é a mensagem?)**

Com isso consigo debugar! 🔍

---

## Dica Extra: Veja Detalhes do Erro

Se no console aparecer `❌ Erro ao criar pedido:`, clique naquele erro para expandir e veja a mensagem completa!
