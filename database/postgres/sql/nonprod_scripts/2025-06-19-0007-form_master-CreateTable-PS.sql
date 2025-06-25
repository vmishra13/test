-- Define a stored procedure to create form_master table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN     
    -- Check if the form_master table exists
        DROP TABLE IF EXISTS patient_form CASCADE;
        DROP TABLE IF EXISTS form_master CASCADE;

        CREATE TABLE form_master (
            id SERIAL PRIMARY KEY,
            "clientId" INTEGER DEFAULT 1,
            "name" VARCHAR(255) NOT NULL,
            "description" TEXT,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_form_master_client FOREIGN KEY ("clientId") REFERENCES client(id)
        );

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
