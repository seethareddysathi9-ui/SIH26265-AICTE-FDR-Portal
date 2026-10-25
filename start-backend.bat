@echo off
echo ================================================
echo  AICTE FDR Management Portal - Backend Startup
echo  SIH26265 Prototype
echo ================================================
echo.

cd /d "%~dp0backend"

echo [1/3] Checking Python...
python --version
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.10+ and try again.
    pause
    exit /b 1
)

echo.
echo [2/3] Installing/verifying dependencies...
pip install -r requirements.txt --quiet

echo.
echo [3/3] Setting up database and seeding demo data...
python seed.py

echo.
echo ================================================
echo  Starting FastAPI backend on http://localhost:8000
echo  API Docs: http://localhost:8000/docs
echo  Press Ctrl+C to stop
echo ================================================
echo.
python run.py
pause
