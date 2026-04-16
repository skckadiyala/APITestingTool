# =============================================================================
# Database Restore Script - PostgreSQL + MongoDB (Windows PowerShell)
# Target: WEBAUTPDVHIL12.corp.cdw.com
# Usage: .\scripts\restore.ps1 -BackupDir <path> [-PostgresOnly] [-MongoOnly]
# =============================================================================

param(
    [Parameter(Mandatory = $true)]
    [string]$BackupDir,
    [switch]$PostgresOnly,
    [switch]$MongoOnly
)

$ErrorActionPreference = "Stop"

# ---- Configuration (override via environment variables) ----
$PG_HOST   = if ($env:POSTGRES_HOST)     { $env:POSTGRES_HOST }     else { "WEBAUTPDVHIL12.corp.cdw.com" }
$PG_PORT   = if ($env:POSTGRES_PORT)     { $env:POSTGRES_PORT }     else { "5432" }
$PG_USER   = if ($env:POSTGRES_USER)     { $env:POSTGRES_USER }     else { "postgres" }
$PG_DB     = if ($env:POSTGRES_DB)       { $env:POSTGRES_DB }       else { "api_testing_tool" }
$PG_PASS   = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "" }

$MONGO_HOST = if ($env:MONGODB_HOST) { $env:MONGODB_HOST } else { "WEBAUTPDVHIL12.corp.cdw.com" }
$MONGO_PORT = if ($env:MONGODB_PORT) { $env:MONGODB_PORT } else { "27017" }
$MONGO_DB   = if ($env:MONGODB_DB)   { $env:MONGODB_DB }   else { "api_testing_tool" }

$RestorePG    = -not $MongoOnly
$RestoreMongo = -not $PostgresOnly

# ---- Helpers ----
function Log($msg) { Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg" }
function Fail($msg) { Log "ERROR: $msg"; exit 1 }

# ---- Validate backup directory ----
if (-not (Test-Path $BackupDir)) { Fail "Backup directory not found: $BackupDir" }

$infoFile = Join-Path $BackupDir "backup_info.json"
if (-not (Test-Path $infoFile)) { Fail "Not a valid backup directory (missing backup_info.json)" }

# ---- Show backup info ----
Log "======================================"
Log "Restore from: $BackupDir"
Get-Content $infoFile | Write-Host
Log "======================================"

# ---- Confirmation ----
Write-Host ""
Write-Host "WARNING: This will OVERWRITE existing data in the target databases." -ForegroundColor Red
Write-Host "  PostgreSQL: $PG_HOST`:$PG_PORT/$PG_DB (restore: $RestorePG)"
Write-Host "  MongoDB:    $MONGO_HOST`:$MONGO_PORT/$MONGO_DB (restore: $RestoreMongo)"
Write-Host ""
$confirm = Read-Host "Type 'yes' to confirm"
if ($confirm -ne "yes") { Log "Aborted."; exit 0 }

# ---- Pre-flight checks ----
if ($RestorePG -and -not (Get-Command pg_restore -ErrorAction SilentlyContinue)) {
    Fail "pg_restore not found. Install PostgreSQL client tools and add to PATH."
}
if ($RestoreMongo -and -not (Get-Command mongorestore -ErrorAction SilentlyContinue)) {
    Fail "mongorestore not found. Install MongoDB Database Tools and add to PATH."
}

# ---- PostgreSQL Restore ----
if ($RestorePG) {
    $pgDumpFile = Join-Path $BackupDir "postgres_${PG_DB}.dump"
    if (-not (Test-Path $pgDumpFile)) { Fail "PostgreSQL dump not found: $pgDumpFile" }

    Log "Restoring PostgreSQL ($PG_HOST`:$PG_PORT/$PG_DB)..."
    $env:PGPASSWORD = $PG_PASS

    & pg_restore -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB --clean --if-exists --no-owner --no-privileges $pgDumpFile
    if ($LASTEXITCODE -ne 0) {
        Log "WARNING: pg_restore exited with code $LASTEXITCODE (this may include non-fatal warnings)"
    }

    $env:PGPASSWORD = ""
    Log "PostgreSQL restore complete"
}

# ---- MongoDB Restore ----
if ($RestoreMongo) {
    $mongoDumpDir = Join-Path $BackupDir "mongodb" $MONGO_DB
    if (-not (Test-Path $mongoDumpDir)) { Fail "MongoDB dump not found: $mongoDumpDir" }

    Log "Restoring MongoDB ($MONGO_HOST`:$MONGO_PORT/$MONGO_DB)..."

    & mongorestore --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --gzip --drop $mongoDumpDir
    if ($LASTEXITCODE -ne 0) { Fail "mongorestore failed with exit code $LASTEXITCODE" }

    Log "MongoDB restore complete"
}

Log "======================================"
Log "Restore complete"
Log "======================================"
