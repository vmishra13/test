-- Define a stored procedure to create form_master table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN     
    -- Check if the form_master table exists
    IF NOT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'reliacare' 
        AND table_name = 'form_master'
    ) THEN        -- Create the form_master table
        CREATE TABLE form_master (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            clientId INTEGER DEFAULT 1,
            crUser VARCHAR(50) NOT NULL,
            crDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            modUser VARCHAR(50) NOT NULL,
            modDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_form_master_client FOREIGN KEY (clientId) REFERENCES client(id)
        );
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
