-- Entity 2: User Type Table
-- Created: 2025-05-29
-- Description: User type classification table for ReliaCare system

CREATE TABLE user_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT user_type_name_unique UNIQUE (name),
    CONSTRAINT user_type_name_check CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE INDEX idx_user_type_name ON user_type (name);
CREATE INDEX "idx_user_type_crDate" ON user_type ("crDate");

COMMENT ON TABLE user_type IS 'User type classification table for ReliaCare system';
COMMENT ON COLUMN user_type.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN user_type.name IS 'Unique user type name (e.g., INTERNAL, EXTERNAL, PATIENT)';
COMMENT ON COLUMN user_type.description IS 'Human-readable description of the user type';
COMMENT ON COLUMN user_type."crUser" IS 'User who created this record';
COMMENT ON COLUMN user_type."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN user_type."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN user_type."modDate" IS 'Timestamp when record was last modified';