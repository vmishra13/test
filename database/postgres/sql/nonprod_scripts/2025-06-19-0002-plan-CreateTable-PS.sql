-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'plan'
    )
    THEN

  CREATE TABLE plan (
    id SERIAL PRIMARY KEY,
    "clientId" integer NOT NULL,
    "name" varchar(100) NOT NULL,
    "description" text,  
    "diagnosisCode" integer NOT NULL,
    "diagnosisName" varchar(100) NOT NULL,
    "version" integer DEFAULT 1,
    "model" json,
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    "modUser" varchar(50) NOT NULL,     
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,    
    CONSTRAINT fk_plan_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,    
    CONSTRAINT fk_plan_diagnosis_master 
        FOREIGN KEY ("diagnosisCode") REFERENCES diagnosis_master(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_plan_diagnosis_name 
        FOREIGN KEY ("diagnosisName") REFERENCES diagnosis_master("name") 
        ON DELETE RESTRICT ON UPDATE CASCADE
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
