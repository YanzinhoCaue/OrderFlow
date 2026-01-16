# Instruções de Migration do Banco de Dados

## 1. Aplicar Migration para available_days

**IMPORTANTE**: Execute este SQL no Supabase SQL Editor antes de usar o modal de pratos.

### Como aplicar:
1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole e execute o seguinte SQL:

```sql
-- Migration: Add available_days to dishes table
ALTER TABLE dishes ADD COLUMN IF NOT EXISTS available_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6];

COMMENT ON COLUMN dishes.available_days IS 'Array of week days (0-6) when dish is available. NULL or empty means available all days';
```

### Verificar se a migration foi aplicada:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'available_days';
```

Se retornar uma linha, a migration foi aplicada com sucesso!

---

## 2. Configurar Supabase Storage para Imagens

### Criar Bucket para Imagens de Pratos:
1. No Supabase Dashboard, vá em **Storage**
2. Clique em **New Bucket**
3. Configure:
   - **Name**: `dish-images`
   - **Public**: ✅ Marque como público
4. Clique em **Create Bucket**

### Configurar RLS Policies:
Execute no SQL Editor:

```sql
-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'dish-images');

-- Policy: Allow public read access
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dish-images');

-- Policy: Allow owners to delete their images
CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dish-images');
```

### Obter URL do Bucket:
Após criar, a URL será:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/dish-images/
```

---

## 3. Verificação Final

Execute para verificar tudo:
```sql
-- Verificar coluna available_days
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'dishes' AND column_name = 'available_days';

-- Verificar bucket
SELECT * FROM storage.buckets WHERE name = 'dish-images';

-- Verificar policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%dish%';
```

Se todos retornarem resultados, está pronto para usar! 🚀
