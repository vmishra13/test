-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN   
    -- Create ENUM type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'literality_enum') THEN
        CREATE TYPE literality_enum AS ENUM ('Left', 'Right', 'Bilateral', 'None');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'patient_plan'
    )
    THEN

        CREATE TABLE "patient_plan" (
            id SERIAL PRIMARY KEY,
            "patientId" integer NOT NULL,
            "clientId" integer DEFAULT 1,            
            "locationId" integer,
            "planId" integer,
            "surgeonId" integer NOT NULL,
            "diagnosisId" integer,
            "diagnosisName" varchar(100),
            "description" text,
            "surgeryDate" date NOT NULL,
            "surgeryTime" time NOT NULL,
            "literality" literality_enum DEFAULT 'None',
            "model" json,
            "crUser" varchar(50),
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_patientplan_user 
                FOREIGN KEY ("patientId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientplan_client 
                FOREIGN KEY ("clientId") REFERENCES client(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientplan_plan 
                FOREIGN KEY ("planId") REFERENCES plan(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientplan_surgeon 
                FOREIGN KEY ("surgeonId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientplan_diagnosis_master 
                FOREIGN KEY ("diagnosisId") REFERENCES diagnosis_master(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_patientplan_diagnosis_name 
                FOREIGN KEY ("diagnosisName") REFERENCES diagnosis_master("name") 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
