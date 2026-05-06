@echo off
REM Raah Career Compass - Backend Starter (Windows)

title Raah Career Compass - Backend
color 0A
cls

echo ==========================================
echo   Raah Career Compass - Backend Server
echo ==========================================
echo.
echo Starting backend on http://localhost:8000
echo Keep this window open while using the app.
echo.

cd /d "%CD%\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause
