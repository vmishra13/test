-- Define a stored procedure to create auditLog table
CREATE OR REPLACE PROCEDURE CreateOrUpdateAuditLogTable()
LANGUAGE plpgsql
AS $$
BEGIN
    DROP TABLE IF EXISTS "auditLog" CASCADE;

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
            "actionSummary" text,
            "sourceSystem" varchar(100),
            "actionUser" integer,
            "actionClient" integer,
            "actionDate" timestamp,
            "spentTime" bigint,
            "comment" text,
            "changeLog" jsonb
        );

END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateAuditLogTable();
