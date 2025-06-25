-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user_role'
    )
    THEN

  CREATE TABLE "user_role" (
    id SERIAL PRIMARY KEY,
    "userId" integer NOT NULL,
    "clientId" integer NOT NULL,
    "roleId" integer NOT NULL,    
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_role_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_role_role 
        FOREIGN KEY ("roleId") REFERENCES role(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE

);

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
