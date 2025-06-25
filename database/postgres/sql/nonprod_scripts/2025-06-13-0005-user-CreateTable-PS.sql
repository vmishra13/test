-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN

   IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'user'
    )
    THEN

  CREATE TABLE "user" (
    id SERIAL PRIMARY KEY,
    "clientId" integer NOT NULL,
    "userTypeId" integer NOT NULL,
    "loginName" varchar(50) NOT NULL,
    "firstName" varchar(50),
    "middleName" varchar(50),
    "lastName" varchar(50),
    email varchar(100),
    dob date,
    mrn varchar(50),
    gender varchar(50),
    "timeZone" varchar(100),
    "profilePicture" varchar(2000),
    "passExpireInDays" integer,
    "extraInfo" json,
    "status" integer,
    "crUser" varchar(50) NOT NULL,
    "crDate" timestamp DEFAULT CURRENT_TIMESTAMP NOT NULL,    
    "modUser" varchar(50) NOT NULL,
    "modDate" timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_client 
        FOREIGN KEY ("clientId") REFERENCES client(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_user_user_type 
        FOREIGN KEY ("userTypeId") REFERENCES user_type(id) 
        ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT uk_user_login_name 
        UNIQUE ("loginName"),
    CONSTRAINT uk_user_email 
        UNIQUE (email),
    CONSTRAINT user_email_check CHECK (((email IS NULL) OR ((email)::text ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))),
    CONSTRAINT user_gender_check CHECK (((gender IS NULL) OR ((gender)::text = ANY ((ARRAY['Male'::character varying, 'Female'::character varying, 'Other'::character varying, 'Prefer not to say'::character varying])::text[])))),
    CONSTRAINT user_loginname_check CHECK ((length(TRIM(BOTH FROM "loginName")) > 0))
);

END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
