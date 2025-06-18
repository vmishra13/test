-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "role" where "name" = 'CLIENT_ADMIN'
    )
    THEN

   INSERT INTO "role"
("name", description, "crUser", "crDate", "modUser", "modDate")
VALUES('CLIENT_ADMIN', 'Organization administrator with full client management access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
