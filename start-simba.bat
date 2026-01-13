@echo off
echo Starting Simba Backend...
cd /d "%~dp0backend"
start "Simba Backend" cmd /k "npm run dev"

echo Starting Simba Frontend...
cd /d "%~dp0frontend"
start "Simba Frontend" cmd /k "npm run dev"

echo.
echo Simba is starting!
echo Backend: http://WEBAUTPDVHIL1.corp.cdw.com:5000
echo Frontend: http://WEBAUTPDVHIL1.corp.cdw.com:5173
echo.
echo Press any key to close this window (services will keep running)
pause >nul
