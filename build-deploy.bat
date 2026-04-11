@echo off
setlocal enabledelayedexpansion

REM ============================================
REM  API Testing Tool - Build & Deploy Script
REM  Windows Batch Script
REM ============================================

set "ROOT_DIR=%~dp0"
set "DEPLOY_DIR=%ROOT_DIR%deploy"
set "TIMESTAMP=%DATE:~-4%%DATE:~-7,2%%DATE:~-10,2%"

echo ============================================
echo  API Testing Tool - Build and Package
echo ============================================
echo.

REM --- Clean previous deploy folder ---
if exist "%DEPLOY_DIR%" (
    echo Cleaning previous deploy folder...
    rmdir /s /q "%DEPLOY_DIR%"
)

REM ============================================
REM  Step 1: Build Backend
REM ============================================
echo.
echo [1/6] Building Backend...
echo ----------------------------------------
cd /d "%ROOT_DIR%backend"
if errorlevel 1 (
    echo ERROR: Cannot navigate to backend directory
    exit /b 1
)

call npm install --production=false
if errorlevel 1 (
    echo ERROR: Backend npm install failed
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Backend build failed
    exit /b 1
)

echo Backend build complete.

REM ============================================
REM  Step 2: Build Frontend
REM ============================================
echo.
echo [2/6] Building Frontend...
echo ----------------------------------------
cd /d "%ROOT_DIR%frontend"
if errorlevel 1 (
    echo ERROR: Cannot navigate to frontend directory
    exit /b 1
)

call npm install --production=false
if errorlevel 1 (
    echo ERROR: Frontend npm install failed
    exit /b 1
)

call npm run build
if errorlevel 1 (
    echo ERROR: Frontend build failed
    exit /b 1
)

echo Frontend build complete.

REM ============================================
REM  Step 3: Create deploy folder structure
REM ============================================
echo.
echo [3/6] Creating deploy folder structure...
echo ----------------------------------------
mkdir "%DEPLOY_DIR%"
mkdir "%DEPLOY_DIR%\backend"
mkdir "%DEPLOY_DIR%\backend\uploads\data-files"
mkdir "%DEPLOY_DIR%\backend\prisma"
mkdir "%DEPLOY_DIR%\frontend"

REM ============================================
REM  Step 4: Copy Frontend files
REM ============================================
echo.
echo [4/6] Copying Frontend files...
echo ----------------------------------------
xcopy /E /I /Q "%ROOT_DIR%frontend\dist" "%DEPLOY_DIR%\frontend\dist"
@REM copy /Y "%ROOT_DIR%frontend\serve-frontend.js" "%DEPLOY_DIR%\frontend\serve-frontend.js"
copy /Y "%ROOT_DIR%frontend\package.json" "%DEPLOY_DIR%\frontend\package.json"

echo Frontend files copied.

REM ============================================
REM  Step 5: Copy Backend files
REM ============================================
echo.
echo [5/6] Copying Backend files...
echo ----------------------------------------

REM Copy compiled JS
xcopy /E /I /Q "%ROOT_DIR%backend\dist" "%DEPLOY_DIR%\backend\dist"

REM Copy package files for production install
copy /Y "%ROOT_DIR%backend\package.json" "%DEPLOY_DIR%\backend\package.json"
copy /Y "%ROOT_DIR%backend\package-lock.json" "%DEPLOY_DIR%\backend\package-lock.json"

REM Copy Prisma schema (needed by @prisma/client at runtime)
copy /Y "%ROOT_DIR%backend\prisma\schema.prisma" "%DEPLOY_DIR%\backend\prisma\schema.prisma"

REM Install production-only dependencies
echo Installing production dependencies...
cd /d "%DEPLOY_DIR%\backend"
call npm install --production
if errorlevel 1 (
    echo ERROR: Production npm install failed
    exit /b 1
)

REM Generate Prisma client in deploy context
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Prisma generate failed
    exit /b 1
)

echo Backend files copied.

REM ============================================
REM  Step 6: Zip the deploy folder
REM ============================================
echo.
echo [6/6] Creating zip archive...
echo ----------------------------------------
cd /d "%ROOT_DIR%"

REM Use PowerShell to create zip (excluding node_modules)
del /q "%ROOT_DIR%deploy.zip" 2>nul
powershell -NoProfile -Command "$src = '%DEPLOY_DIR%'; $zip = '%ROOT_DIR%deploy.zip'; Add-Type -Assembly 'System.IO.Compression.FileSystem'; $archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create'); Get-ChildItem $src -Recurse -File | Where-Object { $_.FullName -notmatch '\\node_modules\\' } | ForEach-Object { $entry = $_.FullName.Substring($src.Length + 1); [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entry) | Out-Null }; $archive.Dispose()"
if errorlevel 1 (
    echo ERROR: Failed to create zip archive
    exit /b 1
)

echo.
echo ============================================
echo  Build and Package Complete!
echo ============================================
echo.
echo  Deploy folder: %DEPLOY_DIR%
echo  Zip archive:   %ROOT_DIR%deploy.zip
echo.
echo  To deploy:
echo    1. Extract deploy.zip to target machine
echo    2. Copy backend\.env, frontend\.env, and ecosystem.config.js
echo    3. cd backend ^& npm install --production ^& npx prisma generate
echo    4. Run: pm2 start ecosystem.config.js
echo ============================================

cd /d "%ROOT_DIR%"
endlocal
