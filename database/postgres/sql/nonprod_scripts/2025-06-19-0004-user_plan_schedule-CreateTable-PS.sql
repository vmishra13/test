-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN     -- Create ENUM types if they don't exist   
     IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'schedule_type') THEN
        CREATE TYPE schedule_type AS ENUM ('Exercise', 'Goal', 'Medication', 'None');
    END IF;    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_unit_type') THEN
        CREATE TYPE frequency_unit_type AS ENUM ('Day', 'Week');
    END IF;    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'measurement_unit_type') THEN
        CREATE TYPE measurement_unit_type AS ENUM ('Count', 'Steps');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user_plan_schedule'
    )
    THEN

    CREATE TABLE "user_plan_schedule" (
        id SERIAL PRIMARY KEY,
        "patientId" integer NOT NULL,
        "clientId" integer DEFAULT 1,
        "patientPlanID" integer NOT NULL,
        "type" schedule_type DEFAULT 'None',
        "typeID" integer NOT NULL,        
        "scheduleDate" timestamp NOT NULL,
        "frequencyUnit" frequency_unit_type DEFAULT NULL,
        "frequencyValue" integer,        
        "scheduleUnit" varchar,
        "scheduleUnitValue" decimal(10,2),
        "measurementUnit" measurement_unit_type DEFAULT NULL,
        "validFrom" date,
        "validTo" date,
        "status" boolean DEFAULT true,
        "crUser" varchar(50) NOT NULL,
        "crDate" timestamp DEFAULT CURRENT_TIMESTAMP, 
        "modUser" varchar(50) NOT NULL,
        "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_user_plan_schedule_user 
            FOREIGN KEY ("patientId") REFERENCES "user"(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_user_plan_schedule_client 
            FOREIGN KEY ("clientId") REFERENCES client(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT fk_user_plan_schedule_user_plan 
            FOREIGN KEY ("patientPlanID") REFERENCES "patient_plan"(id) 
            ON DELETE RESTRICT ON UPDATE CASCADE
    );

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
