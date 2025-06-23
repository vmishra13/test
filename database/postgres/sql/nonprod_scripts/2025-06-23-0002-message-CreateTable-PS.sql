-- Define a stored procedure to create message table
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create ENUM type for message type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        CREATE TYPE message_type_enum AS ENUM ('text', 'html', 'submit_img', 'review_img');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'message'
    )
    THEN        CREATE TABLE "message" (
            id SERIAL PRIMARY KEY,
            "type" message_type_enum NOT NULL,
            "body" text,
            "attachments" json,
            "crUser" varchar(50) NOT NULL,
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50) NOT NULL,
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
