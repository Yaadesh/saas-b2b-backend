-- Migration script to create integration_type table and update integrations table
-- Run this script against your PostgreSQL database

BEGIN;

-- Create integration_type table if it doesn't exist
CREATE TABLE IF NOT EXISTS integration_type (
    id INTEGER PRIMARY KEY,
    type CHAR(20) NOT NULL UNIQUE
);

-- Seed integration_type table with initial data
INSERT INTO integration_type (id, type) VALUES 
    (1, 'functional'),
    (2, 'app')
ON CONFLICT (id) DO NOTHING;

-- Add integration_type column to integrations table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='integrations' AND column_name='integration_type') THEN
        ALTER TABLE integrations ADD COLUMN integration_type INTEGER REFERENCES integration_type(id);
    END IF;
END $$;

-- Update existing records to have integration_type = 1 (functional) if they don't have a value
UPDATE integrations 
SET integration_type = 1 
WHERE integration_type IS NULL;

-- Make integration_type NOT NULL after setting default values
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='integrations' AND column_name='integration_type' 
               AND is_nullable='YES') THEN
        ALTER TABLE integrations ALTER COLUMN integration_type SET NOT NULL;
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 'Integration types:' as info;
SELECT * FROM integration_type;

SELECT 'Sample integrations with types:' as info;
SELECT id, name, integration_type FROM integrations LIMIT 5;