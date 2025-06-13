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
    "userId" integer,
    "clientId" integer,
    "locationId" integer,
    "default" boolean DEFAULT false,
    "status" varchar(5),
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modUser" varchar(50),
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT contact_entity_check CHECK (((((("userId" IS NOT NULL))::integer + (("clientId" IS NOT NULL))::integer) + (("locationId" IS NOT NULL))::integer) = 1)),
    CONSTRAINT contact_type_check CHECK (((type)::text = ANY ((ARRAY['Home'::character varying, 'Work'::character varying, 'Other'::character varying, 'Mobile'::character varying, 'Fax'::character varying, 'Email'::character varying])::text[]))),
    CONSTRAINT contact_value_check CHECK (((value IS NOT NULL) AND ((value)::text <> '{}'::text)))
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
