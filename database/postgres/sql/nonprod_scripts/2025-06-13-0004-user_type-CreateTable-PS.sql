-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user_type'
    )
    THEN

  CREATE TABLE "user_type" (
    id SERIAL PRIMARY KEY,
    "name" varchar(100) NOT NULL,
    "description" varchar(100),
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT user_type_name_check CHECK ((length(TRIM(BOTH FROM "name")) > 0))
);

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
