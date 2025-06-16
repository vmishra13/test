-- Add foreign key constraints to password table
CREATE OR REPLACE PROCEDURE AddPasswordForeignKeys()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add foreign key for userId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'password' 
        AND constraint_name = 'fk_password_user'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE password 
        ADD CONSTRAINT fk_password_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add index for faster lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'password' 
        AND indexname = 'idx_password_user_status'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_password_user_status 
        ON password ("userId", status);
    END IF;

    -- Add index for expiry date lookups
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'password' 
        AND indexname = 'idx_password_expiry'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_password_expiry 
        ON password ("expiryDate") 
        WHERE "expiryDate" IS NOT NULL;
    END IF;

END;
$$;

-- Call the procedure
CALL AddPasswordForeignKeys();

-- Drop the procedure
DROP PROCEDURE AddPasswordForeignKeys();