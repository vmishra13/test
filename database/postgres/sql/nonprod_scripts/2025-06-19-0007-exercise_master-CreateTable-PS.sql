-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create ENUM type for media type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'media_type_enum') THEN
        CREATE TYPE media_type_enum AS ENUM ('Image', 'Video', 'Audio', 'Document', 'Link');
    END IF;

    -- Create ENUM type for frequency unit if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'frequency_unit_type') THEN
        CREATE TYPE frequency_unit_type AS ENUM ('Day', 'Week');
    END IF;

    -- Create ENUM type for unit if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'unit_type') THEN
        CREATE TYPE unit_type AS ENUM ('Set', 'Steps', 'Duration');
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'exercise_master'
    )
    THEN

        CREATE TABLE "exercise_master" (
            id SERIAL PRIMARY KEY,
            "title" varchar(100),
            "description" text,
            "purpose" varchar(255),
            "media_type" media_type_enum DEFAULT NULL,
            "media_url" varchar(255),
            "frequency" frequency_unit_type DEFAULT 'Day',
            "unit" unit_type DEFAULT 'Set',
            "value" integer DEFAULT 1,
            "setUnit" integer DEFAULT 1,
            "repetition" integer DEFAULT 0,
            "procedures" varchar,
            "notes" text,
            "show_checkbox" boolean,
            "SelectionValue" boolean,
            "SelectionUser" varchar,
            "SelectionDate" timestamp,
            "crUser" varchar(50),
            "crDate" timestamp DEFAULT CURRENT_TIMESTAMP,
            "modUser" varchar(50),
            "modDate" timestamp DEFAULT CURRENT_TIMESTAMP
        );

    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
