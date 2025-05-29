-- Entity 4: Client Location Table
-- Created: 2025-05-29
-- Description: Client location/branch information table for ReliaCare system

CREATE TABLE client_location (
    id SERIAL PRIMARY KEY,
    "clientId" INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status INTEGER,
    logo VARCHAR(2000),
    "extraInfo" JSON,
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT client_location_name_check CHECK (LENGTH(TRIM(name)) > 0),
    
    -- Foreign key constraint
    CONSTRAINT fk_client_location_client 
        FOREIGN KEY ("clientId") 
        REFERENCES client(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_client_location_name ON client_location (name);
CREATE INDEX "idx_client_location_clientId" ON client_location ("clientId");
CREATE INDEX idx_client_location_status ON client_location (status);
CREATE INDEX "idx_client_location_crDate" ON client_location ("crDate");

-- Composite index for common queries
CREATE INDEX "idx_client_location_client_status" ON client_location ("clientId", status);

-- Add comments for documentation
COMMENT ON TABLE client_location IS 'Client location/branch information table for ReliaCare system';
COMMENT ON COLUMN client_location.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN client_location."clientId" IS 'Foreign key reference to client.id';
COMMENT ON COLUMN client_location.name IS 'Location/branch name';
COMMENT ON COLUMN client_location.description IS 'Detailed description of the location';
COMMENT ON COLUMN client_location.status IS 'Location status enum (0=inactive, 1=active, etc.)';
COMMENT ON COLUMN client_location.logo IS 'URL or path to location-specific logo image';
COMMENT ON COLUMN client_location."extraInfo" IS 'Additional location information in JSON format';
COMMENT ON COLUMN client_location."crUser" IS 'User who created this record';
COMMENT ON COLUMN client_location."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN client_location."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN client_location."modDate" IS 'Timestamp when record was last modified';