-- Add foreign key constraints to contact table
CREATE OR REPLACE PROCEDURE AddContactForeignKeys()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add foreign key for userId (optional)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'contact' 
        AND constraint_name = 'fk_contact_user'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE contact 
        ADD CONSTRAINT fk_contact_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add foreign key for clientId (optional)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'contact' 
        AND constraint_name = 'fk_contact_client'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE contact 
        ADD CONSTRAINT fk_contact_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add foreign key for locationId (optional)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'contact' 
        AND constraint_name = 'fk_contact_location'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE contact 
        ADD CONSTRAINT fk_contact_location 
        FOREIGN KEY ("locationId") REFERENCES client_location(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add indexes for performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contact' 
        AND indexname = 'idx_contact_user_type'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_contact_user_type 
        ON contact ("userId", "type") 
        WHERE "userId" IS NOT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'contact' 
        AND indexname = 'idx_contact_client_type'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_contact_client_type 
        ON contact ("clientId", "type") 
        WHERE "clientId" IS NOT NULL;
    END IF;

END;
$$;

-- Call the procedure
CALL AddContactForeignKeys();

-- Drop the procedure
DROP PROCEDURE AddContactForeignKeys();