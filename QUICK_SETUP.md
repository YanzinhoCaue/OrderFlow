# 🚀 Guia Rápido de Configuração

## 📋 Checklist de Setup

### ✅ 1. Banco de Dados (COMPLETO)
- [x] Schema SQL executado
- [x] 13 tabelas criadas
- [x] Políticas RLS ativas

### ⚙️ 2. Variáveis de Ambiente (.env.local)

Criar arquivo `.env.local` na raiz com:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Como obter as chaves:**
- Supabase → Project Settings → API
- Copie "Project URL" e "anon public" key

---

### 🗄️ 3. Storage Buckets (CRIAR AGORA)

No Supabase → Storage → New bucket:

1. **restaurant-logos**
   - ✅ Public bucket
   - Usado para: Logos dos restaurantes (onboarding)

2. **restaurant-covers**
   - ✅ Public bucket
   - Usado para: Capas dos perfis (onboarding)

3. **dish-images**
   - ✅ Public bucket
   - Usado para: Fotos dos pratos (menu)

4. **qr-codes**
   - ✅ Public bucket
   - Usado para: QR codes gerados automaticamente

**Importante:** Marque todos como "Public bucket" para URLs públicas funcionarem.

---

### 🔐 4. Authentication URLs

Supabase → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Additional Redirect URLs**: `http://localhost:3000/callback`

---

### 🔑 5. Google OAuth

#### A. Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Criar novo projeto ou usar existente
3. APIs & Services → Credentials → Create OAuth Client ID
4. Application type: Web application
5. **Authorized redirect URIs**: 
   ```
   https://SEU-PROJETO.supabase.co/auth/v1/callback
   ```
6. Copie Client ID e Client Secret

#### B. Supabase

1. Authentication → Providers → Google
2. Enable provider
3. Cole Client ID e Client Secret
4. Save

---

## 🎯 Ordem de Execução

```bash
# 1. Já feito
✅ npm install (dependências instaladas)
✅ database-schema.sql executado

# 2. Fazer agora
⬜ Criar arquivo .env.local com suas chaves
⬜ Criar 4 buckets no Supabase Storage
⬜ Configurar URLs de Auth
⬜ Configurar Google OAuth

# 3. Rodar
npm run dev
```

---

## 🌐 Acessar Aplicação

Após configurar tudo:

```bash
npm run dev
```

- App: http://localhost:3000
- Login: http://localhost:3000/login
- Dashboard: http://localhost:3000/dashboard (após login)

---

## 🐛 Troubleshooting

### Erro "Invalid Supabase credentials"
- Verifique se NEXT_PUBLIC_SUPABASE_URL e ANON_KEY estão corretos no `.env.local`
- Reinicie o servidor (Ctrl+C e `npm run dev` novamente)

### Google OAuth não funciona
- Confirme que o redirect URI no Google Cloud está exatamente:
  `https://SEU-PROJETO.supabase.co/auth/v1/callback`
- Verifique se Site URL no Supabase está `http://localhost:3000`

### Erro ao fazer upload de imagens
- Confirme que os 4 buckets foram criados
- Verifique se estão marcados como "Public"
- Cheque permissões do bucket

### RLS Policy error
- Normal no primeiro login: o profile é criado automaticamente
- Se persistir, verifique se o schema SQL foi executado completamente

---

## 📝 Buckets Usados no Código

| Bucket | Usado em | Arquivo |
|--------|----------|---------|
| `restaurant-logos` | Onboarding Step 3 | `components/onboarding/OnboardingWizard.tsx` |
| `restaurant-covers` | Onboarding Step 3 | `components/onboarding/OnboardingWizard.tsx` |
| `dish-images` | Menu - Adicionar pratos | (Não implementado ainda, preparado para futuro) |
| `qr-codes` | Criar mesa | `app/actions/tables.ts` |

---

## ✨ Próximo Passo

**Agora faça:**

1. Crie o arquivo `.env.local` (pode copiar o `.env.example` e preencher)
2. Crie os 4 buckets no Supabase Storage
3. Configure OAuth (opcional para testar, mas necessário para login funcionar)
4. Execute: `npm run dev`

🎉 **Sua aplicação estará rodando!**
