@echo off
echo ================================================
echo  AICTE FDR Management Portal - Frontend Startup
echo  SIH26265 Prototype
echo ================================================
echo.

cd /d "%~dp0frontend"

echo [1/2] Installing dependencies...
call npm install

echo.
echo [2/2] Starting Vite dev server on http://localhost:5173
echo  Make sure backend is running on http://localhost:8000 first!
echo  Press Ctrl+C to stop
echo ================================================
echo.
call npm run dev
pause
