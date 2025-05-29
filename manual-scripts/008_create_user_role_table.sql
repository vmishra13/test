-- Entity 8: User Role Table
-- Created: 2025-05-29
-- Description: User role assignment table for ReliaCare system (many-to-many relationship)

CREATE TABLE user_role (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "roleId" INTEGER NOT NULL,
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT user_role_unique_assignment UNIQUE ("userId", "clientId", "roleId"),
    
    -- Foreign key constraints
    CONSTRAINT fk_user_role_user 
        FOREIGN KEY ("userId") 
        REFERENCES "user"(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_user_role_client 
        FOREIGN KEY ("clientId") 
        REFERENCES client(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_user_role_role 
        FOREIGN KEY ("roleId") 
        REFERENCES role(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "idx_user_role_userId" ON user_role ("userId");
CREATE INDEX "idx_user_role_clientId" ON user_role ("clientId");
CREATE INDEX "idx_user_role_roleId" ON user_role ("roleId");
CREATE INDEX "idx_user_role_crDate" ON user_role ("crDate");

-- Composite indexes for common queries
CREATE INDEX "idx_user_role_user_client" ON user_role ("userId", "clientId");
CREATE INDEX "idx_user_role_client_role" ON user_role ("clientId", "roleId");
CREATE INDEX "idx_user_role_user_role" ON user_role ("userId", "roleId");

-- Add comments for documentation
COMMENT ON TABLE user_role IS 'User role assignment table for ReliaCare system (many-to-many relationship)';
COMMENT ON COLUMN user_role.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN user_role."userId" IS 'Foreign key reference to user.id';
COMMENT ON COLUMN user_role."clientId" IS 'Foreign key reference to client.id';
COMMENT ON COLUMN user_role."roleId" IS 'Foreign key reference to role.id';
COMMENT ON COLUMN user_role."crUser" IS 'User who created this record';
COMMENT ON COLUMN user_role."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN user_role."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN user_role."modDate" IS 'Timestamp when record was last modified';