-- Define a stored procedure to create auditLog table
CREATE OR REPLACE PROCEDURE CreateOrUpdateAuditLogTable()
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'reliacare'
        AND table_name = 'auditLog'
    )
    THEN
        CREATE TABLE "auditLog" (
            id SERIAL PRIMARY KEY,
            "eventType" varchar(100),
            "entityType" varchar(100),
            "subEntityType" varchar(100),
            "entityId" varchar(100),
            "operationType" varchar(100),
            "operationStatus" varchar(100),
            "actionType" varchar(100),
            "actionSubType" varchar(100),
            "actionSummery" text,
            "sourceSystem" varchar(100),
            "actionUser" integer,
            "actionClient" integer,
            "actionDate" timestamp,
            "spentTime" bigint,
            "comment" text,
            "changeLog" jsonb
        );
    END IF;

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateAuditLogTable();
