-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "role" where "name" = 'SUPER_ADMIN'
    )
    THEN

   INSERT INTO "role"
("name", description, "crUser", "crDate", "modUser", "modDate")
VALUES('SUPER_ADMIN', 'System super administrator with unrestricted access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
