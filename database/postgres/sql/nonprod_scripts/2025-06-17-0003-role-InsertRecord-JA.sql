-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "role" where "name" = 'OFFICE_STAFF'
    )
    THEN

   INSERT INTO "role"
("name", description, "crUser", "crDate", "modUser", "modDate")
VALUES('OFFICE_STAFF', 'Administrative staff including reception, billing, and coordination', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
