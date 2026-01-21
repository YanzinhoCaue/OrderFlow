-- Fix the unique constraint approach for profiles.cpf_cnpj
-- Remove the partial index and use ON CONFLICT approach in application logic

-- Drop the problematic index
DROP INDEX IF EXISTS idx_profiles_cpf_cnpj_unique;

-- Re-add simple unique constraint but allow per-user update
-- Actually, let's remove uniqueness entirely if CPF can change per user
-- Or make it unique only if the CPF belongs to a different user

-- Simple approach: remove global uniqueness, users can update their own CPF
-- ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_cpf_cnpj_key;

-- Better approach: use a check constraint that prevents CPF conflicts
-- For now, let's just allow NULL and not enforce uniqueness globally
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj_unique 
ON profiles(cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL AND cpf_cnpj != '';
