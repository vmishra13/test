-- Define a stored procedure to create plan_user table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create ENUM type for user type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_type_enum') THEN
        CREATE TYPE user_type_enum AS ENUM ('Surgen', 'Clinical_Staff', 'Office_Staff', 'Patient');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'plan_user'
    )
    THEN        CREATE TABLE "plan_user" (
            id SERIAL PRIMARY KEY,
            "clientId" integer NOT NULL,
            "patientPlanId" integer NOT NULL,
            "userId" integer NOT NULL,
            "userType" user_type_enum NOT NULL,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_planuser_client 
                FOREIGN KEY ("clientId") REFERENCES client(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_planuser_patient_plan 
                FOREIGN KEY ("patientPlanId") REFERENCES patient_plan(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_planuser_user 
                FOREIGN KEY ("userId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );
 
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
