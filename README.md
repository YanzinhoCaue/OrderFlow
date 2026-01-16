# 🍽️ iMenuFlow

A complete production-ready digital menu solution for restaurants with real-time order management, multilingual support, and QR code integration.

## ✨ Features

- 🔐 **Google OAuth Authentication** via Supabase
- 🏪 **Restaurant Onboarding** with logo/cover upload
- 🍽️ **Complete Menu Management** (categories, dishes, ingredients)
- 📱 **QR Code Generation** for tables
- 👤 **Public Menu** for customers
- 🔥 **Real-time Order System** (Kitchen & Waiter dashboards)
- 🌍 **i18n Support** (pt-BR, en, es, zh, ja)
- 🎨 **Theme System** (Dark/Light + 20 color themes)
- ✅ **CPF/CNPJ Validation**

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Google OAuth configured in Supabase

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Copy `.env.example` to `.env.local` and fill in your Supabase credentials
4. Run the SQL schema in your Supabase SQL Editor (see `database-schema.sql`)
5. Configure Google OAuth in Supabase Dashboard
6. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
app/
├── (auth)/          # Authentication pages
├── (onboarding)/    # Restaurant setup wizard
├── (dashboard)/     # Admin dashboard
├── (public)/        # Public-facing menu
└── actions/         # Server Actions (API layer)

components/
├── auth/            # Auth components
├── dashboard/       # Admin components
├── menu/            # Menu management
├── orders/          # Order system
├── public-menu/     # Customer-facing UI
└── ui/              # Reusable UI components

lib/
├── supabase/        # Supabase client & types
├── validations/     # Zod schemas & validators
└── utils/           # Utility functions
```

## 🗄️ Database

The database schema includes:
- User profiles
- Restaurants with theming
- Categories & subcategories
- Dishes with multiple images
- Ingredients system
- Tables with QR codes
- Orders with real-time status
- Complete audit trail

All tables have Row Level Security (RLS) enabled for data protection.

## 🔒 Security

- Row Level Security (RLS) on all tables
- Server-side authentication checks
- Protected routes via middleware
- Secure file uploads to Supabase Storage

## 🎨 Theming

20 predefined color themes that dynamically change the entire UI:
- Red, Orange, Yellow, Green, Teal, Blue, Indigo, Purple, Pink, Rose
- Each with dark mode variants

## 🌍 Internationalization

Supported languages:
- Portuguese (Brazil)
- English
- Spanish
- Chinese (Simplified)
- Japanese

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.
