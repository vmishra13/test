-- Define a stored procedure to create ssi_data table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

    DROP TABLE IF EXISTS "ssi_data" CASCADE;

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
        "woundLocation" varchar(100),
        "diabetesFlag" boolean,
        "smokingFlag" boolean,
        "imgCaptureDevice" varchar(255)
    );

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
