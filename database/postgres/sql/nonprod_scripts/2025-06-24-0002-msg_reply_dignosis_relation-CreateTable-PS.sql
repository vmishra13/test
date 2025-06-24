-- Define a stored procedure to create msg_reply_dignosis_relation table
CREATE OR REPLACE PROCEDURE CreateOrUpdateMsgReplyDignosisRelationTable()
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'msg_reply_dignosis_relation'
    )
    THEN
        CREATE TABLE "msg_reply_dignosis_relation" (
            id SERIAL PRIMARY KEY,
            "msgReplyTemplateId" integer NOT NULL,
            "dignosisId" integer NOT NULL,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT fk_msgreplydignosisrel_template 
                FOREIGN KEY ("msgReplyTemplateId") REFERENCES "msg_reply_template"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgreplydignosisrel_dignosis 
                FOREIGN KEY ("dignosisId") REFERENCES "diagnosis_master"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateMsgReplyDignosisRelationTable();
