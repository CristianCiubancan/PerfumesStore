#!/bin/sh
set -e

# Database Migration with Rollback Strategy
# This script creates a pre-migration backup for safety

BACKUP_FILE="/tmp/pre_migration_backup_$(date +%Y%m%d_%H%M%S).sql"

echo "========================================="
echo "Starting Server Initialization"
echo "========================================="

# Extract database connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
if [ -n "$DATABASE_URL" ]; then
  # Parse DATABASE_URL
  DB_USER=$(echo $DATABASE_URL | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
  DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\([^?]*\).*/\1/p')
  DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\([^@]*\)@.*/\1/p')

  echo "Database: $DB_NAME"
  echo "Host: $DB_HOST:$DB_PORT"
  echo ""

  # Check if database is accessible
  echo "Checking database connectivity..."

  # Create .pgpass file for secure password handling
  # Format: hostname:port:database:username:password
  PGPASS_FILE="$HOME/.pgpass"
  echo "$DB_HOST:$DB_PORT:$DB_NAME:$DB_USER:$DB_PASS" > "$PGPASS_FILE"
  chmod 600 "$PGPASS_FILE"

  # Wait for database to be ready (max 30 seconds)
  RETRY_COUNT=0
  MAX_RETRIES=30
  until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" > /dev/null 2>&1 || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 1
  done

  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "Error: Database is not accessible after $MAX_RETRIES attempts"
    rm -f "$PGPASS_FILE"
    exit 1
  fi

  echo "Database is ready!"
  echo ""

  # Create pre-migration backup
  echo "Creating pre-migration backup..."
  if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" "$DB_NAME" > "$BACKUP_FILE" 2>&1; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "Pre-migration backup created: $BACKUP_FILE ($BACKUP_SIZE)"
    echo ""
    echo "To restore this backup if migration fails:"
    echo "  cat $BACKUP_FILE | psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME"
    echo ""
  else
    # Check if backup file was created but is empty (first run scenario)
    if [ -f "$BACKUP_FILE" ] && [ ! -s "$BACKUP_FILE" ]; then
      echo "Warning: Could not create pre-migration backup"
      echo "This might be the first run (empty database)"
      echo ""
    else
      echo "Error: Failed to create pre-migration backup"
      echo "pg_dump exited with an error. Check database connectivity and permissions."
      rm -f "$PGPASS_FILE"
      exit 1
    fi
  fi

  # Clean up .pgpass after backup (will recreate if needed)
  rm -f "$PGPASS_FILE"
fi

# Run database migrations
echo "Running database migrations..."
if npx prisma migrate deploy; then
  echo "Migrations completed successfully!"

  # Clean up backup on success
  if [ -f "$BACKUP_FILE" ]; then
    echo "Cleaning up pre-migration backup..."
    rm -f "$BACKUP_FILE"
  fi
else
  echo ""
  echo "========================================="
  echo "ERROR: Migration failed!"
  echo "========================================="
  echo ""
  echo "A pre-migration backup is available at:"
  echo "  $BACKUP_FILE"
  echo ""
  echo "To restore the database to its pre-migration state:"
  echo "  1. Access the container: docker exec -it <container_name> sh"
  echo "  2. Restore backup: cat $BACKUP_FILE | psql <connection_string>"
  echo ""
  echo "Or from host machine:"
  echo "  docker exec -i <container_name> psql <connection_string> < backup.sql"
  echo ""
  exit 1
fi

echo ""
echo "========================================="
echo "Starting server..."
echo "========================================="
exec npm run start
