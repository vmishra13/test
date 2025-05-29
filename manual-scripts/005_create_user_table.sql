-- Entity 5: User Table
-- Created: 2025-05-29
-- Description: User information table for ReliaCare system

CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    "clientId" INTEGER NOT NULL,
    "userTypeId" INTEGER NOT NULL,
    "loginName" VARCHAR(50) NOT NULL,
    "firstName" VARCHAR(50),
    "middleName" VARCHAR(50),
    "lastName" VARCHAR(50),
    email VARCHAR(100),
    dob DATE,
    mrn VARCHAR(50),
    gender VARCHAR(50),
    "timeZone" VARCHAR(100),
    "profilePicture" VARCHAR(2000),
    "passExpireInDays" INTEGER,
    "extraInfo" JSON,
    status INTEGER,
    "crUser" VARCHAR(50) NOT NULL,
    "crDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "modUser" VARCHAR(50),
    "modDate" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Add constraints
    CONSTRAINT user_loginName_unique UNIQUE ("loginName"),
    CONSTRAINT user_email_unique UNIQUE (email),
    CONSTRAINT user_loginName_check CHECK (LENGTH(TRIM("loginName")) > 0),
    CONSTRAINT user_email_check CHECK (email IS NULL OR email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT user_gender_check CHECK (gender IS NULL OR gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
    CONSTRAINT user_pass_expire_check CHECK ("passExpireInDays" IS NULL OR "passExpireInDays" > 0),
    
    -- Foreign key constraints
    CONSTRAINT fk_user_client 
        FOREIGN KEY ("clientId") 
        REFERENCES client(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
        
    CONSTRAINT fk_user_user_type 
        FOREIGN KEY ("userTypeId") 
        REFERENCES user_type(id) 
        ON DELETE RESTRICT 
        ON UPDATE CASCADE
);

-- Create indexes for performance
CREATE UNIQUE INDEX "idx_user_loginName" ON "user" ("loginName");
CREATE UNIQUE INDEX idx_user_email ON "user" (email);
CREATE INDEX "idx_user_clientId" ON "user" ("clientId");
CREATE INDEX "idx_user_userTypeId" ON "user" ("userTypeId");
CREATE INDEX idx_user_status ON "user" (status);
CREATE INDEX "idx_user_crDate" ON "user" ("crDate");
CREATE INDEX idx_user_mrn ON "user" (mrn);
CREATE INDEX "idx_user_firstName_lastName" ON "user" ("firstName", "lastName");

-- Composite indexes for common queries
CREATE INDEX "idx_user_client_status" ON "user" ("clientId", status);
CREATE INDEX "idx_user_type_status" ON "user" ("userTypeId", status);

-- Add comments for documentation
COMMENT ON TABLE "user" IS 'User information table for ReliaCare system';
COMMENT ON COLUMN "user".id IS 'Auto-incrementing primary key';
COMMENT ON COLUMN "user"."clientId" IS 'Foreign key reference to client.id';
COMMENT ON COLUMN "user"."userTypeId" IS 'Foreign key reference to user_type.id';
COMMENT ON COLUMN "user"."loginName" IS 'Unique login name for authentication';
COMMENT ON COLUMN "user"."firstName" IS 'User first name';
COMMENT ON COLUMN "user"."middleName" IS 'User middle name';
COMMENT ON COLUMN "user"."lastName" IS 'User last name';
COMMENT ON COLUMN "user".email IS 'User email address (unique)';
COMMENT ON COLUMN "user".dob IS 'User date of birth';
COMMENT ON COLUMN "user".mrn IS 'Medical Record Number';
COMMENT ON COLUMN "user".gender IS 'User gender';
COMMENT ON COLUMN "user"."timeZone" IS 'User preferred timezone';
COMMENT ON COLUMN "user"."profilePicture" IS 'URL or path to user profile picture';
COMMENT ON COLUMN "user"."passExpireInDays" IS 'Password expiration period in days';
COMMENT ON COLUMN "user"."extraInfo" IS 'Additional user information in JSON format';
COMMENT ON COLUMN "user".status IS 'User status enum';
COMMENT ON COLUMN "user"."crUser" IS 'User who created this record';
COMMENT ON COLUMN "user"."crDate" IS 'Timestamp when record was created';
COMMENT ON COLUMN "user"."modUser" IS 'User who last modified this record';
COMMENT ON COLUMN "user"."modDate" IS 'Timestamp when record was last modified';