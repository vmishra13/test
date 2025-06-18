-- Define a stored procedure to create the user_type table and insert the data if conditions are met
CREATE OR REPLACE PROCEDURE CreateOrUpdateUserTypeTableAndInsertData()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Check if the 'user_type' table exists in the 'reliacare' schema
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user_type'
    )
    THEN
        -- If the table doesn't exist, create it
        CREATE TABLE reliacare."user_type" (
            id SERIAL PRIMARY KEY,
            "name" varchar(100) NOT NULL,
            "description" varchar(100),
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
            "modUser" varchar(50),
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT user_type_name_check CHECK (length(TRIM(BOTH FROM "name")) > 0),
            CONSTRAINT user_type_name_unique UNIQUE ("name")
        );
    END IF;

    -- Insert data into the user_type table, ensuring no conflicts based on "name"
    INSERT INTO reliacare."user_type" ("name", "description", "crUser", "crDate", "modUser", "modDate")
    VALUES
        ('SUPER_ADMIN', 'System super administrator with unrestricted access', 'Admin', '2025-06-13 21:29:26.744414', 'Admin', '2025-06-13 21:29:26.744414'),
        ('CLIENT_ADMIN', 'Organization administrator with full client management access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('CLINICAL_STAFF', 'Healthcare providers including doctors, nurses, and therapists', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('OFFICE_STAFF', 'Administrative staff including reception, billing, and coordination', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP),
        ('PATIENT', 'Healthcare service recipient with patient portal access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP)
    ON CONFLICT ("name") DO NOTHING;  -- Skip if the user_type with the same name already exists
    
END;
$$;

-- Call the procedure to create/update the user_type table and insert the data
CALL CreateOrUpdateUserTypeTableAndInsertData();
