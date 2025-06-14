#!/bin/bash

# Default values
DEFAULT_HOST="localhost"
DEFAULT_PORT="5432"
DEFAULT_DB="defaultdb"
DEFAULT_USER="defaultuser"
DEFAULT_PASSWORD="defaultpass"
DEFAULT_SCHEMAS="reliacare"

# Usage instructions
if [ "$#" -lt 3 ]; then
  echo "Usage: $0 [database] [username] [password] optional: [host] [port]"
  echo "Example: $0 mydb myuser mypass [localhost] [5432]"
  echo "Note: If host and database are not provided, defaults will be used."
fi

# Assign arguments with fallback to defaults
HOST="${4:-$DEFAULT_HOST}"
PORT="${5:-$DEFAULT_PORT}"
DB="${1:-$DEFAULT_DB}"
USER="${2:-$DEFAULT_USER}"
PASSWORD="${3:-$DEFAULT_PASSWORD}"
SCHEMA_LIST="${6:-$DEFAULT_SCHEMAS}"

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
  SQL_DIR="$SCRIPT_DIR/nonprod_scripts"

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
