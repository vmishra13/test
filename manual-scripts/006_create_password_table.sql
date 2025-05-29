-- Entity 6: Password Table
-- Created: 2025-05-29
-- Description: User password management table for ReliaCare system

CREATE TABLE password (
    id SERIAL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    password VARCHAR(60) NOT NULL,
    "expiryDate" DATE,
    status INTEGER,
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT password_password_check CHECK (LENGTH(password) >= 8),
    CONSTRAINT password_expiry_check CHECK ("expiryDate" IS NULL OR "expiryDate" > CURRENT_DATE),
    
    -- Foreign key constraint
    CONSTRAINT fk_password_user 
        FOREIGN KEY ("userId") 
        REFERENCES "user"(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX "idx_password_userId" ON password ("userId");
CREATE INDEX idx_password_status ON password (status);
CREATE INDEX "idx_password_expiryDate" ON password ("expiryDate");
CREATE INDEX "idx_password_crDate" ON password ("crDate");

-- Composite index for common queries
CREATE INDEX "idx_password_user_status" ON password ("userId", status);
CREATE INDEX "idx_password_user_expiry" ON password ("userId", "expiryDate");

-- Add comments for documentation
COMMENT ON TABLE password IS 'User password management table for ReliaCare system';
COMMENT ON COLUMN password.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN password."userId" IS 'Foreign key reference to user.id';
COMMENT ON COLUMN password.password IS 'Hashed password (bcrypt recommended)';
COMMENT ON COLUMN password."expiryDate" IS 'Password expiration date';
COMMENT ON COLUMN password.status IS 'Password status enum (0=inactive, 1=active, 2=expired)';
COMMENT ON COLUMN password."crUser" IS 'User who created this record';
COMMENT ON COLUMN password."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN password."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN password."modDate" IS 'Timestamp when record was last modified';