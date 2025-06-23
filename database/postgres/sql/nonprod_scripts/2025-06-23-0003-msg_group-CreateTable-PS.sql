-- Define a stored procedure to create msg_group table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create ENUM type for msg_group type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'msg_group_type_enum') THEN
        CREATE TYPE msg_group_type_enum AS ENUM ('Group');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'msg_group'
    )
    THEN

        CREATE TABLE "msg_group" (
            id SERIAL PRIMARY KEY,
            "type" msg_group_type_enum NOT NULL,
            "patientPlanId" integer NOT NULL,
            "patientId" integer NOT NULL,
            "clientId" integer NOT NULL,
            "name" varchar(100) NOT NULL,
            "description" text,
            "active" boolean DEFAULT true,
            "lastMsgId" integer,
            "lastMsgDate" timestamp,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_msggroup_patient_plan 
                FOREIGN KEY ("patientPlanId") REFERENCES patient_plan(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msggroup_patient 
                FOREIGN KEY ("patientId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msggroup_client 
                FOREIGN KEY ("clientId") REFERENCES client(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msggroup_message 
                FOREIGN KEY ("lastMsgId") REFERENCES "message"(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
