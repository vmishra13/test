-- Define a stored procedure to create a table and add multiple records if they don't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
   -- Check if 'SUPER_ADMIN' exists
   IF NOT EXISTS (
        SELECT 1 FROM "role" WHERE "name" = 'SUPER_ADMIN'
    )
    THEN
        INSERT INTO "role" ("name", description, "crUser", "crDate", "modUser", "modDate")
        VALUES ('SUPER_ADMIN', 'System super administrator with unrestricted access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
    END IF;

   -- Check if 'CLIENT_ADMIN' exists
   IF NOT EXISTS (
        SELECT 1 FROM "role" WHERE "name" = 'CLIENT_ADMIN'
    )
    THEN
        INSERT INTO "role" ("name", description, "crUser", "crDate", "modUser", "modDate")
        VALUES ('CLIENT_ADMIN', 'Organization administrator with full client management access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
    END IF;

   -- Check if 'CLINICAL_STAFF' exists
   IF NOT EXISTS (
        SELECT 1 FROM "role" WHERE "name" = 'CLINICAL_STAFF'
    )
    THEN
        INSERT INTO "role" ("name", description, "crUser", "crDate", "modUser", "modDate")
        VALUES ('CLINICAL_STAFF', 'Healthcare providers including doctors, nurses, and therapists', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
    END IF;

   -- Check if 'OFFICE_STAFF' exists
   IF NOT EXISTS (
        SELECT 1 FROM "role" WHERE "name" = 'OFFICE_STAFF'
    )
    THEN
        INSERT INTO "role" ("name", description, "crUser", "crDate", "modUser", "modDate")
        VALUES ('OFFICE_STAFF', 'Administrative staff including reception, billing, and coordination', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
    END IF;

   -- Check if 'PATIENT' exists
   IF NOT EXISTS (
        SELECT 1 FROM "role" WHERE "name" = 'PATIENT'
    )
    THEN
        INSERT INTO "role" ("name", description, "crUser", "crDate", "modUser", "modDate")
        VALUES ('PATIENT', 'Healthcare service recipient with patient portal access', 'Admin', CURRENT_TIMESTAMP, 'Admin', CURRENT_TIMESTAMP);
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
