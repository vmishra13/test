-- Define a stored procedure to create msg_group_relation table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'msg_group_relation'
    )
    THEN

        CREATE TABLE "msg_group_relation" (
            id SERIAL PRIMARY KEY,
            "msgGroupId" integer NOT NULL,
            "msgId" integer NOT NULL,
            "senderId" integer NOT NULL,
            "extraInfo" json,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_msgrelation_msg_group 
                FOREIGN KEY ("msgGroupId") REFERENCES msg_group(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgrelation_message 
                FOREIGN KEY ("msgId") REFERENCES "message"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgrelation_sender 
                FOREIGN KEY ("senderId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
