#!/bin/bash
#
# Database Backup Script for PerfumesStore
#
# This script creates timestamped backups of the PostgreSQL database
# and manages backup retention (keeps last 7 days by default).
#
# Usage:
#   ./scripts/backup-db.sh [backup_directory]
#
# Environment Variables (from .env):
#   - POSTGRES_USER: Database user
#   - POSTGRES_PASSWORD: Database password
#   - POSTGRES_DB: Database name
#   - COMPOSE_PROJECT_NAME: Project name (for container identification)
#

set -e

# Configuration
BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS=7
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="perfumes_store_backup_${TIMESTAMP}.sql"

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Set defaults
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-perfumes_store}"
COMPOSE_PROJECT_NAME="${COMPOSE_PROJECT_NAME:-perfumesstoreclean}"

echo "========================================="
echo "PerfumesStore Database Backup"
echo "========================================="
echo "Timestamp: $(date)"
echo "Database: ${POSTGRES_DB}"
echo "User: ${POSTGRES_USER}"
echo "Backup Directory: ${BACKUP_DIR}"
echo "========================================="

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

# Check if postgres container is running
CONTAINER_NAME="${COMPOSE_PROJECT_NAME}-postgres-1"
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  # Try alternative naming pattern
  CONTAINER_NAME="${COMPOSE_PROJECT_NAME}_postgres_1"
  if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "Error: PostgreSQL container is not running"
    echo "Expected container name: ${COMPOSE_PROJECT_NAME}-postgres-1 or ${COMPOSE_PROJECT_NAME}_postgres_1"
    echo "Running containers:"
    docker ps --format '{{.Names}}'
    exit 1
  fi
fi

echo "Using container: ${CONTAINER_NAME}"
echo ""

# Create backup
echo "Creating backup..."
docker exec "${CONTAINER_NAME}" pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" > "${BACKUP_DIR}/${BACKUP_FILE}"

# Check if backup was successful
if [ $? -eq 0 ]; then
  echo "Backup created successfully: ${BACKUP_DIR}/${BACKUP_FILE}"

  # Get backup file size
  BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
  echo "Backup size: ${BACKUP_SIZE}"
else
  echo "Error: Backup failed!"
  exit 1
fi

# Compress backup
echo ""
echo "Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"
COMPRESSED_SIZE=$(du -h "${BACKUP_DIR}/${COMPRESSED_FILE}" | cut -f1)
echo "Compressed backup: ${BACKUP_DIR}/${COMPRESSED_FILE}"
echo "Compressed size: ${COMPRESSED_SIZE}"

# Clean up old backups
echo ""
echo "Cleaning up old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_DIR}" -name "perfumes_store_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# List remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "perfumes_store_backup_*.sql.gz" -type f | wc -l)
echo "Total backups: ${BACKUP_COUNT}"

echo ""
echo "========================================="
echo "Backup completed successfully!"
echo "========================================="
echo ""
echo "To restore this backup, run:"
echo "  gunzip -c ${BACKUP_DIR}/${COMPRESSED_FILE} | docker exec -i ${CONTAINER_NAME} psql -U ${POSTGRES_USER} ${POSTGRES_DB}"
echo ""
