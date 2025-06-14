-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "user_role" where "userId" = 1
    )
    THEN

   INSERT INTO "user_role"
("userId", "clientId", "roleId", "crUser", "crDate", "modUser", "modDate")
VALUES(1, 1, 1, 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
