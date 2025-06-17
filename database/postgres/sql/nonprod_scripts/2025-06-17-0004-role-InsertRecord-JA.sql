-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "role" where "name" = 'PATIENT'
    )
    THEN

   INSERT INTO "role"
("name", description, "crUser", "crDate", "modUser", "modDate")
VALUES('PATIENT', 'Healthcare service recipient with patient portal access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
