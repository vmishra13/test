-- Define a stored procedure to create msg_reply_diagnosis_relation table
CREATE OR REPLACE PROCEDURE CreateOrUpdateMsgReplyDiagnosisRelationTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Drop the table if it exists to ensure clean recreation with correct constraint names
    DROP TABLE IF EXISTS "msg_reply_diagnosis_relation" CASCADE;
    
    -- Create the table with correct constraint names
    CREATE TABLE "msg_reply_diagnosis_relation" (
            id SERIAL PRIMARY KEY,
            "msgReplyTemplateId" integer NOT NULL,
            "diagnosisId" integer NOT NULL,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT fk_msgreplydiagnosisrel_template 
                FOREIGN KEY ("msgReplyTemplateId") REFERENCES "msg_reply_template"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgreplydiagnosisrel_diagnosis 
                FOREIGN KEY ("diagnosisId") REFERENCES "diagnosis_master"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateMsgReplyDiagnosisRelationTable();
