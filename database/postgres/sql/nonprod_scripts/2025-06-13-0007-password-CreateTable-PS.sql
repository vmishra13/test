-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'password'
    )
    THEN

  CREATE TABLE password (
    id SERIAL PRIMARY KEY,
    "userId" integer NOT NULL,
    "password" varchar(60) NOT NULL,
    "expiryDate" date,
    "status" integer,
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_password_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT password_expiry_check CHECK ((("expiryDate" IS NULL) OR ("expiryDate" > CURRENT_DATE))),
    CONSTRAINT password_password_check CHECK ((length((password)::text) >= 8))
);

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
