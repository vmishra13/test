-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN     

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'form_master'
    )
    THEN

    CREATE TABLE "form_master" (
        id SERIAL PRIMARY KEY,
        "name" varchar(255),
        "description" text,
        "clientId" integer DEFAULT 1,
        "crUser" varchar(50),
        "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
        "modUser" varchar(50),
        "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_form_master_client 
            FOREIGN KEY ("clientId") REFERENCES client(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE
    );

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
