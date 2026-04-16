#!/bin/bash
# =============================================================================
# Database Backup Script - PostgreSQL + MongoDB
# Target: WEBAUTPDVHIL12.corp.cdw.com
# Usage: ./scripts/backup.sh [backup_dir]
# =============================================================================

set -euo pipefail

# ---- Configuration (override via environment variables) ----
PG_HOST="${POSTGRES_HOST:-WEBAUTPDVHIL12.corp.cdw.com}"
PG_PORT="${POSTGRES_PORT:-5432}"
PG_USER="${POSTGRES_USER:-postgres}"
PG_DB="${POSTGRES_DB:-api_testing_tool}"

MONGO_HOST="${MONGODB_HOST:-WEBAUTPDVHIL12.corp.cdw.com}"
MONGO_PORT="${MONGODB_PORT:-27017}"
MONGO_DB="${MONGODB_DB:-api_testing_tool}"

# Backup directory
BACKUP_ROOT="${1:-$(dirname "$0")/../backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_ROOT}/${TIMESTAMP}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# ---- Helpers ----
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

# ---- Pre-flight checks ----
command -v pg_dump   >/dev/null 2>&1 || fail "pg_dump not found. Install PostgreSQL client tools."
command -v mongodump >/dev/null 2>&1 || fail "mongodump not found. Install MongoDB Database Tools."

mkdir -p "$BACKUP_DIR"

log "======================================"
log "Starting backup to: $BACKUP_DIR"
log "======================================"

# ---- PostgreSQL Backup ----
log "Backing up PostgreSQL ($PG_HOST:$PG_PORT/$PG_DB)..."
export PGPASSWORD="${POSTGRES_PASSWORD:-}"

pg_dump \
  -h "$PG_HOST" \
  -p "$PG_PORT" \
  -U "$PG_USER" \
  -d "$PG_DB" \
  -F c \
  -Z 6 \
  -f "$BACKUP_DIR/postgres_${PG_DB}.dump"

unset PGPASSWORD

PG_SIZE=$(du -sh "$BACKUP_DIR/postgres_${PG_DB}.dump" | cut -f1)
log "PostgreSQL backup complete ($PG_SIZE)"

# ---- MongoDB Backup ----
log "Backing up MongoDB ($MONGO_HOST:$MONGO_PORT/$MONGO_DB)..."

mongodump \
  --host "$MONGO_HOST" \
  --port "$MONGO_PORT" \
  --db "$MONGO_DB" \
  --gzip \
  --out "$BACKUP_DIR/mongodb"

MONGO_SIZE=$(du -sh "$BACKUP_DIR/mongodb" | cut -f1)
log "MongoDB backup complete ($MONGO_SIZE)"

# ---- Write metadata ----
cat > "$BACKUP_DIR/backup_info.json" <<EOF
{
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "postgres": {
    "host": "$PG_HOST",
    "port": "$PG_PORT",
    "database": "$PG_DB",
    "file": "postgres_${PG_DB}.dump",
    "size": "$PG_SIZE"
  },
  "mongodb": {
    "host": "$MONGO_HOST",
    "port": "$MONGO_PORT",
    "database": "$MONGO_DB",
    "directory": "mongodb/${MONGO_DB}",
    "size": "$MONGO_SIZE"
  }
}
EOF

# ---- Cleanup old backups ----
if [ "$RETENTION_DAYS" -gt 0 ]; then
  log "Cleaning up backups older than $RETENTION_DAYS days..."
  DELETED=0
  for dir in "$BACKUP_ROOT"/*/; do
    if [ -d "$dir" ] && [ -f "$dir/backup_info.json" ]; then
      dir_age=$(( ( $(date +%s) - $(date -r "$dir" +%s) ) / 86400 ))
      if [ "$dir_age" -gt "$RETENTION_DAYS" ]; then
        rm -rf "$dir"
        DELETED=$((DELETED + 1))
      fi
    fi
  done
  [ "$DELETED" -gt 0 ] && log "Removed $DELETED old backup(s)"
fi

log "======================================"
log "Backup complete: $BACKUP_DIR"
log "======================================"
