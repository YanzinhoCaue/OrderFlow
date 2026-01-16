# Setup dos Buckets do Supabase

## Como criar os buckets no Supabase

1. **Acesse o Supabase Console**
   - Vá para https://app.supabase.com
   - Abra seu projeto

2. **Vá para Storage**
   - Clique em "Storage" no menu esquerdo

3. **Crie os 4 buckets necessários:**

### Bucket 1: restaurant-logos
- **Name**: `restaurant-logos`
- **Public**: Marque "Public bucket"
- **Clique**: Create bucket

### Bucket 2: restaurant-covers
- **Name**: `restaurant-covers`
- **Public**: Marque "Public bucket"
- **Clique**: Create bucket

### Bucket 3: dish-images
- **Name**: `dish-images`
- **Public**: Marque "Public bucket"
- **Clique**: Create bucket

### Bucket 4: qr-codes
- **Name**: `qr-codes`
- **Public**: Marque "Public bucket"
- **Clique**: Create bucket

## Políticas de RLS (Row Level Security)

Se o upload ainda não funcionar, verifique as políticas de RLS em cada bucket:

1. Clique no bucket
2. Vá para "Policies"
3. Clique em "New Policy"
4. Selecione "For full customization"
5. Configure assim:

**Política de INSERT:**
```sql
SELECT CASE WHEN auth.uid() IS NOT NULL THEN true ELSE false END
```

**Política de SELECT:**
```sql
SELECT true -- Permite leitura pública
```

Salve e repita para cada bucket.

## Testando

Após criar os buckets:
1. Volte para o app
2. Preencha o formulário de onboarding
3. Selecione a logo
4. Clique em "Finalizar Cadastro"
5. A logo deve aparecer na sidebar do dashboard
