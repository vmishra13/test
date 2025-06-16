-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "contact" where "userId" = 1
    )
    THEN

   INSERT INTO "contact"
("type", value, "userId", "clientId", "locationId", "default", status, "crUser", "crDate", "modUser", "modDate")
VALUES('Email', '{"address": "admin@reliacare.com", "verified": true}', 1, NULL, NULL, true, 'A', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
