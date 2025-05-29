-- Entity 1: Role Table
-- Created: 2025-05-29
-- Description: User roles and permissions table

CREATE TABLE role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(100),
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT role_name_unique UNIQUE (name),
    CONSTRAINT role_name_check CHECK (LENGTH(TRIM(name)) > 0)
);

CREATE INDEX idx_role_name ON role (name);
CREATE INDEX "idx_role_crDate" ON role ("crDate");

COMMENT ON TABLE role IS 'User roles and permissions table for ReliaCare system';
COMMENT ON COLUMN role.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN role.name IS 'Unique role name (e.g., DOCTOR, NURSE, ADMIN)';
COMMENT ON COLUMN role.description IS 'Human-readable description of the role';
COMMENT ON COLUMN role."crUser" IS 'User who created this record';
COMMENT ON COLUMN role."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN role."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN role."modDate" IS 'Timestamp when record was last modified';