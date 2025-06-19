-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'contact'
    )
    THEN

  CREATE TABLE contact (
    id SERIAL PRIMARY KEY,
    "type" varchar(50) NOT NULL,
    "value" json NOT NULL,
    "userId" integer NOT NULL,
    "clientId" integer NOT NULL,
    "default" boolean DEFAULT false,
    "status" varchar(5),
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_contact_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_contact_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT contact_type_check CHECK (((type)::text = ANY ((ARRAY['Home'::character varying, 'Work'::character varying, 'Other'::character varying, 'Mobile'::character varying, 'Fax'::character varying, 'Email'::character varying])::text[]))),
    CONSTRAINT contact_value_check CHECK (((value IS NOT NULL) AND ((value)::text <> '{}'::text)))
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
