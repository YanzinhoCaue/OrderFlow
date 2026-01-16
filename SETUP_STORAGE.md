# 🗂️ Configuração do Supabase Storage para Upload de Imagens

## Passo 1: Criar o Bucket

1. Acesse o **Supabase Dashboard** do seu projeto
2. No menu lateral, clique em **Storage**
3. Clique no botão **"New bucket"**
4. Configure:
   - **Name**: `dish-images`
   - **Public bucket**: ✅ **Marque esta opção**
   - **File size limit**: 5 MB (ou deixe padrão)
   - **Allowed MIME types**: Deixe vazio (permitirá todos os tipos)
5. Clique em **"Create bucket"**

---

## Passo 2: Configurar Políticas de Segurança (RLS)

### Opção A: Políticas Recomendadas (Mais Seguras)

Vá em **Storage** → Clique no bucket `dish-images` → Aba **"Policies"** → **"New Policy"**

#### 1. Permitir Upload para Usuários Autenticados

```sql
-- Policy Name: Allow authenticated uploads
-- Operation: INSERT

CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'dish-images'
);
```

#### 2. Permitir Leitura Pública

```sql
-- Policy Name: Allow public read access
-- Operation: SELECT

CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dish-images');
```

#### 3. Permitir Exclusão para Donos

```sql
-- Policy Name: Allow authenticated deletes
-- Operation: DELETE

CREATE POLICY "Allow authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'dish-images');
```

---

### Opção B: Política Simples (Para Testes)

Se quiser algo mais simples para testar rapidamente:

```sql
-- Permitir TUDO para usuários autenticados
CREATE POLICY "Allow all for authenticated users"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'dish-images')
WITH CHECK (bucket_id = 'dish-images');

-- Permitir leitura pública
CREATE POLICY "Allow public read"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dish-images');
```

---

## Passo 3: Verificar Configuração

Execute este SQL no **SQL Editor** para verificar se está tudo certo:

```sql
-- Verificar se o bucket existe
SELECT * FROM storage.buckets WHERE name = 'dish-images';

-- Verificar políticas
SELECT * FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
```

---

## Passo 4: Testar Upload

1. Volte para o dashboard do OrderFlow
2. Vá em **Cardápio** → **Novo Prato**
3. Tente fazer upload de uma imagem
4. Se funcionar, você verá a URL da imagem no formato:
   ```
   https://[seu-projeto].supabase.co/storage/v1/object/public/dish-images/...
   ```

---

## 🔧 Solução de Problemas

### Erro: "Bucket not found"
❌ **Problema**: Bucket não foi criado  
✅ **Solução**: Volte ao Passo 1 e crie o bucket `dish-images`

### Erro: "new row violates row-level security"
❌ **Problema**: Políticas RLS não configuradas  
✅ **Solução**: Execute os comandos SQL do Passo 2

### Erro: "Invalid JWT"
❌ **Problema**: Usuário não está autenticado  
✅ **Solução**: Faça logout e login novamente

### Erro: "File size limit exceeded"
❌ **Problema**: Imagem maior que 5MB  
✅ **Solução**: Reduza o tamanho da imagem ou aumente o limite no bucket

---

## 📝 Estrutura de Pastas

As imagens são salvas com a seguinte estrutura:

```
dish-images/
└── {restaurantId}/
    ├── 1736879234567-abc123.jpg
    ├── 1736879456789-def456.png
    └── ...
```

Cada restaurante tem sua própria pasta para organização! 🗂️

---

## ✅ Checklist Final

- [ ] Bucket `dish-images` criado e marcado como público
- [ ] Políticas RLS configuradas (Opção A ou B)
- [ ] Teste de upload realizado com sucesso
- [ ] URL pública da imagem funcionando
- [ ] Imagens aparecendo no cardápio

Se todos os itens estiverem ✅, o upload está funcionando perfeitamente! 🎉
