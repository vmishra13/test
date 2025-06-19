-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'patient_form'
    )
    THEN

        CREATE TABLE "patient_form" (
            id SERIAL PRIMARY KEY,
            "patientId" integer,
            "clientId" integer,
            "processed" boolean DEFAULT false,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_patientform_user 
                FOREIGN KEY ("patientId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientform_client 
                FOREIGN KEY ("clientId") REFERENCES client(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
