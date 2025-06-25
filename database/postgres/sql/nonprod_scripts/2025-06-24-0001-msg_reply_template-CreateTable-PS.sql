-- Define a stored procedure to create msg_reply_template table
CREATE OR REPLACE PROCEDURE CreateOrUpdateMsgReplyTemplateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'msg_reply_template'
    )
    THEN
        CREATE TABLE "msg_reply_template" (
            id SERIAL PRIMARY KEY,
            "userId" integer NOT NULL,
            "clientId" integer NOT NULL,
            "question" varchar(500) NOT NULL,
            "answer" varchar(500) NOT NULL,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT fk_msgreplytemplate_user 
                FOREIGN KEY ("userId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgreplytemplate_client 
                FOREIGN KEY ("clientId") REFERENCES "client"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateMsgReplyTemplateTable();
