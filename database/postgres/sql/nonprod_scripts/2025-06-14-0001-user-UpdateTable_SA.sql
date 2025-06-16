-- Add foreign key constraints to user table
CREATE OR REPLACE PROCEDURE AddUserForeignKeys()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add foreign key for clientId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user' 
        AND constraint_name = 'fk_user_client'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE "user" 
        ADD CONSTRAINT fk_user_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add foreign key for userTypeId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user' 
        AND constraint_name = 'fk_user_user_type'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE "user" 
        ADD CONSTRAINT fk_user_user_type 
        FOREIGN KEY ("userTypeId") REFERENCES user_type(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;

    -- Add unique constraint for loginName 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user' 
        AND constraint_name = 'uk_user_login_client'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE "user" 
        ADD CONSTRAINT uk_user_login_client 
        UNIQUE ("loginName");
    END IF;

    -- Add unique constraint for email 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user' 
        AND constraint_name = 'uk_user_email_client'
        AND table_schema = 'reliacare'
    ) THEN
        CREATE UNIQUE INDEX uk_user_email_client 
        ON "user" ("email") 
        WHERE email IS NOT NULL;
    END IF;

END;
$$;

-- Call the procedure
CALL AddUserForeignKeys();

-- Drop the procedure
DROP PROCEDURE AddUserForeignKeys();