-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'diagnosis_master'
    )
    THEN        CREATE TABLE "diagnosis_master" (
            id SERIAL PRIMARY KEY,
            "name" varchar(100) UNIQUE,
            "bodyArea" varchar(100) NOT NULL,
            "groupType" varchar(100) NOT NULL,
            "leftICDCode" varchar(50),
            "rightICDCode" varchar(50),
            "bilateralICDCode" varchar(50),
            "noneICDCode" varchar(50),
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
