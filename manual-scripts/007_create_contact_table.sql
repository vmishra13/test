-- Entity 7: Contact Table
-- Created: 2025-05-29
-- Description: Contact information table for users, clients, and locations in ReliaCare system

CREATE TABLE contact (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    value JSON NOT NULL,
    "userId" INTEGER,
    "clientId" INTEGER,
    "locationId" INTEGER,
    "default" BOOLEAN DEFAULT FALSE,
    status VARCHAR(5),
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT contact_type_check CHECK (type IN ('Home', 'Work', 'Other', 'Mobile', 'Fax', 'Email')),
    CONSTRAINT contact_value_check CHECK (value IS NOT NULL AND value::text != '{}'),
    CONSTRAINT contact_entity_check CHECK (
        ("userId" IS NOT NULL)::INTEGER + 
        ("clientId" IS NOT NULL)::INTEGER + 
        ("locationId" IS NOT NULL)::INTEGER = 1
    ),
    
    -- Foreign key constraints
    CONSTRAINT fk_contact_user 
        FOREIGN KEY ("userId") 
        REFERENCES "user"(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_contact_client 
        FOREIGN KEY ("clientId") 
        REFERENCES client(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_contact_location 
        FOREIGN KEY ("locationId") 
        REFERENCES client_location(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_contact_type ON contact (type);
CREATE INDEX "idx_contact_userId" ON contact ("userId");
CREATE INDEX "idx_contact_clientId" ON contact ("clientId");
CREATE INDEX "idx_contact_locationId" ON contact ("locationId");
CREATE INDEX idx_contact_status ON contact (status);
CREATE INDEX "idx_contact_default" ON contact ("default");
CREATE INDEX "idx_contact_crDate" ON contact ("crDate");

-- Composite indexes for common queries
CREATE INDEX "idx_contact_user_type" ON contact ("userId", type);
CREATE INDEX "idx_contact_client_type" ON contact ("clientId", type);
CREATE INDEX "idx_contact_location_type" ON contact ("locationId", type);
CREATE INDEX "idx_contact_user_default" ON contact ("userId", "default");

-- Partial indexes for default contacts
CREATE INDEX "idx_contact_user_default_true" ON contact ("userId") WHERE "default" = TRUE;
CREATE INDEX "idx_contact_client_default_true" ON contact ("clientId") WHERE "default" = TRUE;
CREATE INDEX "idx_contact_location_default_true" ON contact ("locationId") WHERE "default" = TRUE;

-- Add comments for documentation
COMMENT ON TABLE contact IS 'Contact information table for users, clients, and locations in ReliaCare system';
COMMENT ON COLUMN contact.id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN contact.type IS 'Contact type enum (Home, Work, Other, Mobile, Fax, Email)';
COMMENT ON COLUMN contact.value IS 'Contact value in JSON format (phone number, email, address, etc.)';
COMMENT ON COLUMN contact."userId" IS 'Foreign key reference to user.id (optional)';
COMMENT ON COLUMN contact."clientId" IS 'Foreign key reference to client.id (optional)';
COMMENT ON COLUMN contact."locationId" IS 'Foreign key reference to client_location.id (optional)';
COMMENT ON COLUMN contact."default" IS 'Whether this is the default contact for this type';
COMMENT ON COLUMN contact.status IS 'Contact status (Active, Inactive, etc.)';
COMMENT ON COLUMN contact."crUser" IS 'User who created this record';
COMMENT ON COLUMN contact."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN contact."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN contact."modDate" IS 'Timestamp when record was last modified';