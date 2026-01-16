# 🚀 Guia de Instalação e Setup - Smart Digital Menu

## 📋 Pré-requisitos

- **Node.js** 18+ instalado
- **npm** ou **yarn**
- Conta no **Supabase** (gratuita)
- **Google Cloud Console** para OAuth

---

## 🔧 Passo 1: Clonar e Instalar Dependências

```bash
# Instalar dependências
npm install

# ou com yarn
yarn install
```

---

## 🗄️ Passo 2: Configurar Supabase

### 2.1 Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Crie uma nova organização e projeto
3. Anote a **URL do projeto** e a **anon key**

### 2.2 Executar o Schema SQL

1. No dashboard do Supabase, vá em **SQL Editor**
2. Abra o arquivo `database-schema.sql` deste projeto
3. Copie e cole todo o conteúdo no editor SQL
4. Clique em **Run** para executar

### 2.3 Configurar Storage Buckets

No Supabase Dashboard, vá em **Storage** e crie os seguintes buckets como **públicos**:

- `restaurant-logos`
- `restaurant-covers`
- `dish-images`
- `qr-codes`

Para cada bucket:
1. Clique em "New bucket"
2. Marque a opção **Public bucket**
3. Clique em "Create bucket"

---

## 🔐 Passo 3: Configurar Google OAuth

### 3.1 Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto (ou use existente)
3. Ative a **Google+ API**
4. Vá em **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure:
   - **Application type**: Web application
   - **Authorized redirect URIs**: 
     ```
     https://seu-projeto.supabase.co/auth/v1/callback
     ```
6. Copie o **Client ID** e **Client Secret**

### 3.2 Configurar no Supabase

1. No Supabase Dashboard, vá em **Authentication** → **Providers**
2. Habilite **Google**
3. Cole o **Client ID** e **Client Secret**
4. Salve as alterações

---

## ⚙️ Passo 4: Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como encontrar suas credenciais no Supabase:**
- Vá em **Project Settings** → **API**
- Copie a **URL** e a **anon/public key**

---

## 🚀 Passo 5: Executar o Projeto

```bash
# Modo de desenvolvimento
npm run dev

# ou
yarn dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

---

## 📱 Fluxo de Uso

### Para Donos de Restaurante:

1. **Login**: Clique em "Entrar com Google"
2. **Onboarding**: Complete o cadastro do restaurante
   - Informações básicas
   - Dados do proprietário (CPF/CNPJ)
   - Upload de logo e capa
   - Escolha do tema de cor
3. **Dashboard**: Acesse o painel administrativo
4. **Menu**: Crie categorias e pratos
5. **Mesas**: Adicione mesas e gere QR codes
6. **Cozinha**: Acompanhe pedidos em tempo real
7. **Garçom**: Visualize pedidos prontos para entrega

### Para Clientes:

1. Escaneie o **QR Code** na mesa
2. Navegue pelo cardápio digital
3. Selecione pratos e personalize ingredientes
4. Faça o pedido
5. Acompanhe o status em tempo real

---

## 🎨 Personalização

### Cores do Tema

O sistema oferece 10 temas de cores predefinidos:
- Vermelho, Laranja, Amarelo, Verde, Azul-petróleo
- Azul, Índigo, Roxo, Rosa, Rose

Cada tema se adapta automaticamente ao modo claro/escuro.

### Idiomas Suportados

- 🇧🇷 Português (Brasil)
- 🇺🇸 English
- 🇪🇸 Español
- 🇨🇳 中文 (Chinês)
- 🇯🇵 日本語 (Japonês)

---

## 🔒 Segurança (RLS - Row Level Security)

O projeto implementa RLS em todas as tabelas:
- Proprietários só acessam seus próprios dados
- Clientes podem criar pedidos, mas não modificar
- Dados públicos são filtrados automaticamente

---

## 📊 Funcionalidades Implementadas

✅ **Autenticação**
- Google OAuth via Supabase
- Proteção de rotas
- Perfis de usuário

✅ **Onboarding**
- Wizard de 4 etapas
- Validação de CPF/CNPJ
- Upload de imagens
- Geração de slug único

✅ **Dashboard Administrativo**
- Visão geral com estatísticas
- Gerenciamento completo de menu
- Sistema de categorias multinível
- Pratos com múltiplas imagens
- Ingredientes customizáveis

✅ **Mesas e QR Codes**
- Geração automática de QR codes
- Link único por mesa
- Download de QR codes

✅ **Sistema de Pedidos**
- Criação de pedidos via menu público
- Status em tempo real
- Dashboard da cozinha
- Dashboard do garçom
- Histórico de status

✅ **Menu Público**
- Acesso via QR code
- Design responsivo
- Tema dinâmico
- Multilíngue

✅ **Realtime**
- Atualização automática de pedidos
- Supabase Realtime channels
- Sincronização entre dashboards

✅ **i18n**
- 5 idiomas suportados
- Troca de idioma em tempo real
- Conteúdo do menu traduzível

✅ **Temas**
- Modo claro/escuro
- 10 cores personalizáveis
- CSS variables dinâmicas

---

## 🛠️ Stack Tecnológica

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: Supabase (PostgreSQL)
- **Autenticação**: Supabase Auth
- **Storage**: Supabase Storage
- **Realtime**: Supabase Realtime
- **QR Codes**: qrcode library
- **Ícones**: React Icons

---

## 📝 Próximos Passos (Opcional)

- [ ] Implementar carrinho de compras completo
- [ ] Sistema de pagamento integrado
- [ ] Notificações push
- [ ] Relatórios e analytics
- [ ] Impressora térmica para cozinha
- [ ] App mobile com React Native
- [ ] Sistema de fidelidade
- [ ] Avaliações de pratos

---

## 🐛 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se as variáveis de ambiente estão corretas
- Confirme que copiou a **anon key**, não a service key

### Erro: "Table does not exist"
- Execute o schema SQL completo no Supabase
- Verifique se não há erros na execução

### Erro: "OAuth Error"
- Confirme que a URL de callback está correta
- Verifique se o Google OAuth está habilitado no Supabase

### QR Code não funciona
- Confirme que a mesa está ativa
- Verifique se o restaurante completou o onboarding
- Teste a URL manualmente

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação do Supabase
2. Revise os logs do console
3. Inspecione a aba Network no DevTools

---

## 📄 Licença

MIT License - Sinta-se livre para usar em projetos pessoais ou comerciais.

---

**Desenvolvido com ❤️ usando Next.js e Supabase**
