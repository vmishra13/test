-- Define a stored procedure to create a table and add a column if it doesn't exist
CREATE OR REPLACE PROCEDURE CreateOrUpdateTable()
LANGUAGE plpgsql
AS $$
BEGIN
    -- Create the table if it doesn't exist
    
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.tables 
        WHERE table_schema = 'reliacare' 
        AND table_name = 'india'
    ) THEN
        CREATE TABLE reliacare.india (
            id INT PRIMARY KEY,
            name VARCHAR(50)
        );
    END IF;
    
    -- Add the column 'new_column' if it does not exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'reliacare' 
        AND table_name = 'india' 
        AND column_name = 'new_column'
    ) THEN
        ALTER TABLE reliacare.india 
        ADD COLUMN new_column VARCHAR(50);
    END IF;
    
END;
$$;

-- Call the stored procedure
CALL CreateOrUpdateTable();
