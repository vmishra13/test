-- Entity 3: Client Table
-- Created: 2025-05-29
-- Description: Client organization information table for ReliaCare system

CREATE TABLE client (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    "timeZone" VARCHAR(100),
    status INTEGER DEFAULT -1,
    logo VARCHAR(2000),
    "favIcon" VARCHAR(2000),
    language VARCHAR(50),
    website VARCHAR(2000),
    "extraInfo" JSON,
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT client_name_unique UNIQUE (name),
    CONSTRAINT client_name_check CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT client_website_check CHECK (website IS NULL OR website ~ '^https?://'),
    CONSTRAINT client_timezone_check CHECK ("timeZone" IS NULL OR LENGTH(TRIM("timeZone")) > 0)
);

-- Create indexes for performance
CREATE INDEX idx_client_name ON client (name);
CREATE INDEX idx_client_status ON client (status);
CREATE INDEX "idx_client_crDate" ON client ("crDate");
CREATE INDEX "idx_client_timeZone" ON client ("timeZone");

-- Add comments for documentation
COMMENT ON TABLE client IS 'Client organization information table for ReliaCare system';
COMMENT ON COLUMN client.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN client.name IS 'Unique client organization name';
COMMENT ON COLUMN client.description IS 'Detailed description of the client organization';
COMMENT ON COLUMN client."timeZone" IS 'Client timezone (e.g., America/New_York, UTC)';
COMMENT ON COLUMN client.status IS 'Client status enum (-1=inactive, 0=pending, 1=active)';
COMMENT ON COLUMN client.logo IS 'URL or path to client logo image';
COMMENT ON COLUMN client."favIcon" IS 'URL or path to client favicon';
COMMENT ON COLUMN client.language IS 'Client preferred language enum (e.g., en, es, fr)';
COMMENT ON COLUMN client.website IS 'Client organization website URL';
COMMENT ON COLUMN client."extraInfo" IS 'Additional client information in JSON format';
COMMENT ON COLUMN client."crUser" IS 'User who created this record';
COMMENT ON COLUMN client."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN client."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN client."modDate" IS 'Timestamp when record was last modified';