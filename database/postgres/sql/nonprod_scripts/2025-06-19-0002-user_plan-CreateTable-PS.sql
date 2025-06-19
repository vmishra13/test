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
        AND table_name = 'user_plan'
    )
    THEN

  CREATE TABLE "user_plan" (
        id SERIAL PRIMARY KEY,
    "userId" integer,
    "clientId" integer DEFAULT 1,
    "locationId" integer,
    "planId" integer,
    "diagnosisCode" varchar(100),
    "description" text,    "surgeryDate" date,
    "surgeryTime" time,
    "literality" literality_enum DEFAULT 'None',
    "model" json,
    "parentId" integer,
    "crUser" varchar(50),
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    "modUser" varchar(50),
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT fk_userplan_user 
        FOREIGN KEY ("userId") REFERENCES "user"(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_userplan_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_userplan_client_location 
        FOREIGN KEY ("locationId") REFERENCES "client_location"(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_userplan_plan 
        FOREIGN KEY ("planId") REFERENCES plan(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE
 
);
END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
