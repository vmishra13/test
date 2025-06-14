-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   IF NOT EXISTS (
        SELECT * from "password" where "userId" = 1
    )
    THEN

   INSERT INTO "password"
("userId", "password", "expiryDate", status, "crUser", "crDate", "modUser", "modDate")
VALUES(1, '$2a$12$B3GFNGoJWIiNQBaCP2UKNuMnhXwZVDuhZTEBnV/R14gqf8y9rboFC', '2025-08-28', 1, 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
 
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
