ALTER TABLE extension_api_keys
ADD COLUMN IF NOT EXISTS key_name TEXT;

UPDATE extension_api_keys
SET key_name = COALESCE(NULLIF(TRIM(key_name), ''), 'My Extension Key');
