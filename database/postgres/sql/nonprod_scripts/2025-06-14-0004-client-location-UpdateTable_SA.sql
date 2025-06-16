-- Add foreign key constraints to client_location table
CREATE OR REPLACE PROCEDURE AddClientLocationForeignKeys()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add foreign key for clientId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'client_location' 
        AND constraint_name = 'fk_client_location_client'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE client_location 
        ADD CONSTRAINT fk_client_location_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add unique constraint for location name per client
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'client_location' 
        AND constraint_name = 'uk_client_location_name'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE client_location 
        ADD CONSTRAINT uk_client_location_name 
        UNIQUE ("clientId", "name");
    END IF;

    -- Add index for client lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'client_location' 
        AND indexname = 'idx_client_location_client_status'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_client_location_client_status 
        ON client_location ("clientId", status);
    END IF;

END;
$$;

-- Call the procedure
CALL AddClientLocationForeignKeys();

-- Drop the procedure
DROP PROCEDURE AddClientLocationForeignKeys();