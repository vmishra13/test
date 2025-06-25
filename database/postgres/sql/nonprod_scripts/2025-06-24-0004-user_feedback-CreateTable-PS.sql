-- Define a stored procedure to create user_feedback table
CREATE OR REPLACE PROCEDURE CreateOrUpdateUserFeedbackTable()
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user_feedback'
    )
    THEN
        CREATE TABLE "user_feedback" (
            id SERIAL PRIMARY KEY,
            "userId" integer NOT NULL,
            "clientId" integer NOT NULL,
            "feedback" text,
            "isBug" boolean DEFAULT false,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            
            CONSTRAINT fk_userfeedback_user 
                FOREIGN KEY ("userId") REFERENCES "user"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT fk_userfeedback_client 
                FOREIGN KEY ("clientId") REFERENCES "client"(id) 
                ON DELETE RESTRICT ON UPDATE CASCADE
        );
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateUserFeedbackTable();
