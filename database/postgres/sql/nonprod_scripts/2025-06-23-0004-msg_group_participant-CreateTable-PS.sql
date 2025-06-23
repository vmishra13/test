-- Define a stored procedure to create msg_group_participant table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN    -- Create ENUM type for box type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'box_type_enum') THEN
        CREATE TYPE box_type_enum AS ENUM ('Inbox', 'Archive', 'Deleted');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'msg_group_participant'
    )
    THEN        CREATE TABLE "msg_group_participant" (
            id SERIAL PRIMARY KEY,
            "msgGroupId" integer NOT NULL,
            "userId" integer NOT NULL,
            "userType" user_type_enum NOT NULL,
            "boxtype" box_type_enum NOT NULL,
            "unReadCount" integer DEFAULT 0,
            "firstUnreadMsgId" integer,
            "firstUnreadMsgDate" timestamp,
            "validFrom" date,
            "validTo" date,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,            
            CONSTRAINT fk_msgparticipant_msg_group 
                FOREIGN KEY ("msgGroupId") REFERENCES msg_group(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgparticipant_user 
                FOREIGN KEY ("userId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_msgparticipant_message 
                FOREIGN KEY ("firstUnreadMsgId") REFERENCES "message"(id) 
                ON DELETE SET NULL ON UPDATE CASCADE
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
