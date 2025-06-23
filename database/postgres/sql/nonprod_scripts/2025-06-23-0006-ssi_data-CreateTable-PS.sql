-- Define a stored procedure to create ssi_data table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'ssi_data'
    )
    THEN

        CREATE TABLE "ssi_data" (
            id SERIAL PRIMARY KEY,
            "ssiImageUrl" varchar(500),
            "ssiClassification" varchar(100),
            "ssiComment" text,
            "gender" varchar(50),
            "age" integer,
            "bmi" double precision,
            "dateOfSurgery" date,
            "imgTakenDate" timestamp,
            "typeOfSurgery" varchar(100),
            "woundLoction" varchar(100),
            "diabetesFlag" boolean,
            "smokingFlag" boolean,
            "imgCaptueDevice" varchar(255)
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
