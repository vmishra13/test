-- Add foreign key constraints to user_role table
CREATE OR REPLACE PROCEDURE AddUserRoleForeignKeys()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Add foreign key for userId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_role' 
        AND constraint_name = 'fk_user_role_user'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE user_role 
        ADD CONSTRAINT fk_user_role_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add foreign key for clientId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_role' 
        AND constraint_name = 'fk_user_role_client'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE user_role 
        ADD CONSTRAINT fk_user_role_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add foreign key for roleId
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_role' 
        AND constraint_name = 'fk_user_role_role'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE user_role 
        ADD CONSTRAINT fk_user_role_role 
        FOREIGN KEY ("roleId") REFERENCES role(id) 
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    -- Add unique constraint to prevent duplicate role assignments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_role' 
        AND constraint_name = 'uk_user_role_assignment'
        AND table_schema = 'reliacare'
    ) THEN
        ALTER TABLE user_role 
        ADD CONSTRAINT uk_user_role_assignment 
        UNIQUE ("userId", "clientId", "roleId");
    END IF;

    -- Add indexes for performance
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_role' 
        AND indexname = 'idx_user_role_user'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_user_role_user 
        ON user_role ("userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'user_role' 
        AND indexname = 'idx_user_role_client'
        AND schemaname = 'reliacare'
    ) THEN
        CREATE INDEX idx_user_role_client 
        ON user_role ("clientId");
    END IF;

END;
$$;

-- Call the procedure
CALL AddUserRoleForeignKeys();

-- Drop the procedure
DROP PROCEDURE AddUserRoleForeignKeys();