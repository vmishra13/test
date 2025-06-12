#!/bin/bash

# Usage instructions
if [ "$#" -lt 5 ]; then
  echo "Usage: $0 <host> <port> <database> <username> <password>"
  echo "Example: $0 my-host 5439 mydb myuser mypass"
  exit 1
fi

# Parameterized database connection variables
HOST="$1"
PORT="$2"
DB="$3"
USER="$4"
PASSWORD="$5"
SCHEMA_LIST="reliacare"

# Export PGPASSWORD so it can be used by psql
export PGPASSWORD=$PASSWORD

# Set client encoding to UTF8
export PGCLIENTENCODING=UTF8

# Get the directory of the current script
SCRIPT_DIR=$(dirname "$0")

# Convert comma-separated schema list into an array
IFS=',' read -r -a SCHEMAS <<< "$SCHEMA_LIST"

# Loop over each schema and execute the SQL scripts
for SCHEMA in "${SCHEMAS[@]}"; do
  SQL_DIR="$SCRIPT_DIR/tobeexecuted"

  if [ -d "$SQL_DIR" ]; then
    for sql_file in "$SQL_DIR"/*.sql; do
      [ -e "$sql_file" ] || continue
      echo "Running $sql_file on schema $SCHEMA..."
      psql -h "$HOST" -p "$PORT" -d "$DB" -U "$USER" -c "SET search_path TO $SCHEMA;" -f "$sql_file"
    done
  else
    echo "Directory $SQL_DIR does not exist. Skipping schema $SCHEMA."
  fi
done

# Unset PGPASSWORD for security reasons
unset PGPASSWORD
