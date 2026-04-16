#!/bin/bash
# =============================================================================
# Database Restore Script - PostgreSQL + MongoDB
# Target: WEBAUTPDVHIL12.corp.cdw.com
# Usage: ./scripts/restore.sh <backup_dir> [--postgres-only | --mongo-only]
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

# ---- Helpers ----
log()  { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
fail() { log "ERROR: $*" >&2; exit 1; }

# ---- Parse arguments ----
BACKUP_DIR=""
RESTORE_PG=true
RESTORE_MONGO=true

for arg in "$@"; do
  case "$arg" in
    --postgres-only) RESTORE_MONGO=false ;;
    --mongo-only)    RESTORE_PG=false ;;
    -h|--help)
      echo "Usage: $0 <backup_dir> [--postgres-only | --mongo-only]"
      echo ""
      echo "Arguments:"
      echo "  backup_dir       Path to a backup folder (created by backup.sh)"
      echo "  --postgres-only  Restore only PostgreSQL"
      echo "  --mongo-only     Restore only MongoDB"
      echo ""
      echo "Examples:"
      echo "  $0 ../backups/20260410_120000"
      echo "  $0 ../backups/20260410_120000 --postgres-only"
      exit 0
      ;;
    *)
      [ -z "$BACKUP_DIR" ] && BACKUP_DIR="$arg" ;;
  esac
done

[ -z "$BACKUP_DIR" ] && fail "Usage: $0 <backup_dir> [--postgres-only | --mongo-only]"
[ -d "$BACKUP_DIR" ] || fail "Backup directory not found: $BACKUP_DIR"
[ -f "$BACKUP_DIR/backup_info.json" ] || fail "Not a valid backup directory (missing backup_info.json)"

# ---- Show backup info ----
log "======================================"
log "Restore from: $BACKUP_DIR"
cat "$BACKUP_DIR/backup_info.json"
log "======================================"

# ---- Confirmation ----
echo ""
echo "WARNING: This will OVERWRITE existing data in the target databases."
echo "  PostgreSQL: $PG_HOST:$PG_PORT/$PG_DB (restore: $RESTORE_PG)"
echo "  MongoDB:    $MONGO_HOST:$MONGO_PORT/$MONGO_DB (restore: $RESTORE_MONGO)"
echo ""
read -rp "Type 'yes' to confirm: " CONFIRM
[ "$CONFIRM" = "yes" ] || { log "Aborted."; exit 0; }

# ---- Pre-flight checks ----
$RESTORE_PG    && { command -v pg_restore  >/dev/null 2>&1 || fail "pg_restore not found."; }
$RESTORE_MONGO && { command -v mongorestore >/dev/null 2>&1 || fail "mongorestore not found."; }

# ---- PostgreSQL Restore ----
if $RESTORE_PG; then
  PG_DUMP="$BACKUP_DIR/postgres_${PG_DB}.dump"
  [ -f "$PG_DUMP" ] || fail "PostgreSQL dump not found: $PG_DUMP"

  log "Restoring PostgreSQL ($PG_HOST:$PG_PORT/$PG_DB)..."
  export PGPASSWORD="${POSTGRES_PASSWORD:-}"

  pg_restore \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DB" \
    --clean \
    --if-exists \
    --no-owner \
    --no-privileges \
    "$PG_DUMP"

  unset PGPASSWORD
  log "PostgreSQL restore complete"
fi

# ---- MongoDB Restore ----
if $RESTORE_MONGO; then
  MONGO_DUMP="$BACKUP_DIR/mongodb/$MONGO_DB"
  [ -d "$MONGO_DUMP" ] || fail "MongoDB dump not found: $MONGO_DUMP"

  log "Restoring MongoDB ($MONGO_HOST:$MONGO_PORT/$MONGO_DB)..."

  mongorestore \
    --host "$MONGO_HOST" \
    --port "$MONGO_PORT" \
    --db "$MONGO_DB" \
    --gzip \
    --drop \
    "$MONGO_DUMP"

  log "MongoDB restore complete"
fi

log "======================================"
log "Restore complete"
log "======================================"
