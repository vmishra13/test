-- Define a stored procedure to create the table and insert the data if conditions are met
CREATE OR REPLACE PROCEDURE CreateOrUpdateTableAndInsertData()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the 'role' table exists in the 'reliacare' schema
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'role'
    )
    THEN
        -- If the table doesn't exist, create it
        CREATE TABLE reliacare."role" (
            id SERIAL PRIMARY KEY,
            "name" varchar(100) NOT NULL,
            "description" varchar(100),
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "modUser" varchar(50),
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT role_name_check CHECK (length(TRIM(BOTH FROM "name")) > 0),
            CONSTRAINT role_name_unique UNIQUE ("name")
        );
    END IF;

    -- Insert data, ensuring there are no conflicts based on "name"
    INSERT INTO reliacare."role" ("name", "description", "crUser", "crDate", "modUser", "modDate")
    VALUES
        ('SUPER_ADMIN', 'System super administrator with unrestricted access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('CLIENT_ADMIN', 'Organization administrator with full client management access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('CLINICAL_STAFF', 'Healthcare providers including doctors, nurses, and therapists', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('OFFICE_STAFF', 'Administrative staff including reception, billing, and coordination', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('PATIENT', 'Healthcare service recipient with patient portal access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP)
    ON CONFLICT ("name") DO NOTHING;  -- Skip if the role already exists (based on name)
    
END;
$$;

-- Call the procedure to create/update the table and insert the data
CALL CreateOrUpdateTableAndInsertData();