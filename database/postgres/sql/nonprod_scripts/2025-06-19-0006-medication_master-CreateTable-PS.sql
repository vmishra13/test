-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN     
    -- Create ENUM type for dosage form if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dosage_form_type') THEN
        CREATE TYPE dosage_form_type AS ENUM ('Tablet', 'Capsule', 'Liquid', 'Injection', 'Cream', 'Ointment', 'Patch', 'Spray', 'Drop', 'Inhaler', 'Other');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'medication_master'
    )
    THEN

    CREATE TABLE "medication_master" (
        id SERIAL PRIMARY KEY,
        "name" varchar(255) NOT NULL,
        "clientId" integer DEFAULT 1,
        "identifier" varchar(50),
        "code" varchar(50),
        "doageForm" dosage_form_type DEFAULT NULL,
        "strength" varchar(50),
        "manufacturer" varchar(255),
        "description" text,
        "crUser" varchar(50) NOT NULL,
        "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
        "modUser" varchar(50) NOT NULL,
        "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_medication_master_client 
            FOREIGN KEY ("clientId") REFERENCES client(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE
    );

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
