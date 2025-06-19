-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "user" where "loginName" = 'superadmin'
    )
    THEN

    INSERT INTO "user"
("id", "clientId", "userTypeId", "loginName", "firstName", "middleName", "lastName", email, dob, mrn, gender, "timeZone", "profilePicture", "passExpireInDays", "extraInfo", status, "crUser", "crDate", "modUser", "modDate")
VALUES(1, 1, 1, 'superadmin', 'System', NULL, 'Administrator', 'admin@reliacare.com', NULL, NULL, 'Other', 'UTC', NULL, 1, NULL, 1, 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();

