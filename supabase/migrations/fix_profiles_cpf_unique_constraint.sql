-- Fix unique constraint on profiles.cpf_cnpj
-- The constraint should allow the same user to update their CPF, 
-- or be removed entirely if CPF doesn't need to be globally unique

-- Drop the old unique constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_cpf_cnpj_key;

-- Add a new constraint that allows NULL values (for users without CPF yet)
-- and creates a partial unique index (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_cpf_cnpj_unique 
ON profiles(cpf_cnpj) 
WHERE cpf_cnpj IS NOT NULL;

-- If you want CPF to be unique per user ID instead (safer approach):
-- Uncomment below and remove the above index
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_id_cpf_cnpj 
-- ON profiles(id, cpf_cnpj)
-- WHERE cpf_cnpj IS NOT NULL;
