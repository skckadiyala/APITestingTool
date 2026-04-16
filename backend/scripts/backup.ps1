# =============================================================================
# Database Backup Script - PostgreSQL + MongoDB (Windows PowerShell)
# Target: WEBAUTPDVHIL12.corp.cdw.com
# Usage: .\scripts\backup.ps1 [-BackupDir <path>]
# =============================================================================

param(
    [string]$BackupDir = ""
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

$RETENTION_DAYS = if ($env:BACKUP_RETENTION_DAYS) { [int]$env:BACKUP_RETENTION_DAYS } else { 30 }

# ---- Paths ----
$ScriptDir  = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKUP_ROOT = if ($BackupDir) { $BackupDir } else { Join-Path (Split-Path -Parent $ScriptDir) "backups" }
$TIMESTAMP  = Get-Date -Format "yyyyMMdd_HHmmss"
$BACKUP_PATH = Join-Path $BACKUP_ROOT $TIMESTAMP

# ---- Helpers ----
function Log($msg) { Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg" }
function Fail($msg) { Log "ERROR: $msg"; exit 1 }

# ---- Pre-flight checks ----
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
    Fail "pg_dump not found. Install PostgreSQL client tools and add to PATH."
}
if (-not (Get-Command mongodump -ErrorAction SilentlyContinue)) {
    Fail "mongodump not found. Install MongoDB Database Tools and add to PATH."
}

New-Item -ItemType Directory -Path $BACKUP_PATH -Force | Out-Null

Log "======================================"
Log "Starting backup to: $BACKUP_PATH"
Log "======================================"

# ---- PostgreSQL Backup ----
Log "Backing up PostgreSQL ($PG_HOST`:$PG_PORT/$PG_DB)..."
$env:PGPASSWORD = $PG_PASS

$pgDumpFile = Join-Path $BACKUP_PATH "postgres_${PG_DB}.dump"
& pg_dump -h $PG_HOST -p $PG_PORT -U $PG_USER -d $PG_DB -F c -Z 6 -f $pgDumpFile
if ($LASTEXITCODE -ne 0) { Fail "pg_dump failed with exit code $LASTEXITCODE" }

$env:PGPASSWORD = ""
$pgSize = "{0:N2} MB" -f ((Get-Item $pgDumpFile).Length / 1MB)
Log "PostgreSQL backup complete ($pgSize)"

# ---- MongoDB Backup ----
Log "Backing up MongoDB ($MONGO_HOST`:$MONGO_PORT/$MONGO_DB)..."

$mongoOutDir = Join-Path $BACKUP_PATH "mongodb"
& mongodump --host $MONGO_HOST --port $MONGO_PORT --db $MONGO_DB --gzip --out $mongoOutDir
if ($LASTEXITCODE -ne 0) { Fail "mongodump failed with exit code $LASTEXITCODE" }

$mongoSize = "{0:N2} MB" -f ((Get-ChildItem $mongoOutDir -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB)
Log "MongoDB backup complete ($mongoSize)"

# ---- Write metadata ----
$backupInfo = @{
    timestamp = $TIMESTAMP
    date      = (Get-Date -Format "o")
    postgres  = @{
        host     = $PG_HOST
        port     = $PG_PORT
        database = $PG_DB
        file     = "postgres_${PG_DB}.dump"
        size     = $pgSize
    }
    mongodb   = @{
        host      = $MONGO_HOST
        port      = $MONGO_PORT
        database  = $MONGO_DB
        directory = "mongodb/$MONGO_DB"
        size      = $mongoSize
    }
} | ConvertTo-Json -Depth 3

$backupInfo | Out-File -FilePath (Join-Path $BACKUP_PATH "backup_info.json") -Encoding UTF8

# ---- Cleanup old backups ----
if ($RETENTION_DAYS -gt 0) {
    Log "Cleaning up backups older than $RETENTION_DAYS days..."
    $cutoff = (Get-Date).AddDays(-$RETENTION_DAYS)
    $deleted = 0
    Get-ChildItem -Path $BACKUP_ROOT -Directory | ForEach-Object {
        $infoFile = Join-Path $_.FullName "backup_info.json"
        if ((Test-Path $infoFile) -and ($_.LastWriteTime -lt $cutoff)) {
            Remove-Item -Recurse -Force $_.FullName
            $deleted++
        }
    }
    if ($deleted -gt 0) { Log "Removed $deleted old backup(s)" }
}

Log "======================================"
Log "Backup complete: $BACKUP_PATH"
Log "======================================"
