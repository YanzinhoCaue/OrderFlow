# 🍽️ OrderFlow

Plataforma completa de cardápio digital com gestão de pedidos em tempo real, QR Codes por mesa e painel administrativo responsivo (mobile-first).

## ✨ Destaques

- 🔐 Login com Google via Supabase e RLS em todas as tabelas
- 🏪 Onboarding de restaurante com logo/capa, temas e idiomas
- 📱 Cardápio público com QR Code por mesa e acompanhamento de pedido
- 🧑‍🍳 Dashboards de Cozinha e Garçom em tempo real (Supabase Realtime)
- 🖥️ Sidebar colapsável e menu hambúrguer mobile (header mantém apenas ícone em telas pequenas)
- 📊 Dashboard com gráficos interativos e tooltips fixos
- 🌍 i18n (pt-BR, en, es, zh, ja) com trocador no header e no cardápio público
- 🎨 Suporte a dark/light + temas coloridos

## 🧰 Tech Stack

- Next.js 15 (App Router) + React 19
- Tailwind CSS
- Supabase (Auth, DB, Realtime, Storage)
- TypeScript, Zod
- Jest + React Testing Library

## 🚀 Como rodar

1. Requisitos: Node.js 18+, conta Supabase, OAuth Google configurado
2. Instale deps: `npm install`
3. Copie `.env.example` → `.env.local` e preencha chaves Supabase/OAuth
4. Execute o schema SQL em `database-schema.sql` (ou migrações em `migrations/`)
5. Dev server: `npm run dev` e acesse http://localhost:3000

Principais scripts:
- `npm run dev` — ambiente local
- `npm run test` — testes unitários/RTL
- `npm run lint` — lint

## 📁 Estrutura

```
app/
 ├─ (auth)        # login/logout
 ├─ (onboarding)  # wizard de criação do restaurante
 ├─ (dashboard)   # header + sidebar + páginas internas
 ├─ (public)      # cardápio público por QR
 └─ actions       # Server Actions

components/
 ├─ dashboard     # Sidebar, Header, gráficos, etc.
 ├─ menu          # Cardápio público, carrinho, avaliações
 ├─ orders        # Fluxos de pedido
 └─ ui            # Componentes reutilizáveis

lib/              # supabase client, validações, utils
migrations/       # migrações SQL
```

## 🗄️ Banco & Segurança

- Tabelas: profiles, restaurants, categories, dishes (multi-imagem), ingredients, tables (QR), orders, audit trail
- RLS ativa em todas as tabelas + checks de autenticação
- Upload seguro no Supabase Storage

## 📱 UX & Responsividade

- Sidebar colapsável no desktop e menu hambúrguer no mobile (ícone na cor laranja do tema)
- Labels do menu sempre visíveis em telas < 1024px
- Header esconde o nome do restaurante em telas pequenas, mantendo apenas o ícone do menu
- Tooltips de gráfico com posição fixa para não cortar no mobile

## 🌍 Idiomas

- pt-BR, en, es, zh, ja — trocador disponível no header (dashboard) e no cardápio público
MIT
