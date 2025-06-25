-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'client_location'
    )
    THEN

  CREATE TABLE client_location (
    id SERIAL PRIMARY KEY,
    "clientId" integer NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" text,
    "status" integer,
    "logo" varchar(2000),
    "extraInfo" json,
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_client_location_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uk_client_location_client_name 
        UNIQUE ("clientId", "name"),
    CONSTRAINT client_location_name_check CHECK ((length(TRIM(BOTH FROM "name")) > 0))
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();

