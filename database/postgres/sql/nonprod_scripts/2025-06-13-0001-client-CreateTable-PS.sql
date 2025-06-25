-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'client'
    )
    THEN

  CREATE TABLE client (
    id SERIAL PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "description" text,
    "timeZone" varchar(100) NOT NULL,
    "status" integer DEFAULT '-1'::integer,
    "logo" varchar(2000),
    "favIcon" varchar(2000),
    "language" varchar(50),
    "website" varchar(2000),
    "extraInfo" json,
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT client_name_check CHECK ((length(TRIM(BOTH FROM name)) > 0)),
    CONSTRAINT client_timezone_check CHECK ((("timeZone" IS NULL) OR (length(TRIM(BOTH FROM "timeZone")) > 0))),
    CONSTRAINT client_website_check CHECK (((website IS NULL) OR ((website)::text ~ '^https?://'::text)))
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
