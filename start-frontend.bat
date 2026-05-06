@echo off
REM Raah Career Compass - Frontend Starter (Windows)

title Raah Career Compass - Frontend
color 0A
cls

echo ==========================================
echo   Raah Career Compass - Frontend Server
echo ==========================================
echo.
echo Starting frontend on http://localhost:3000
echo Keep this window open while using the app.
echo.
echo Note: Make sure the backend is running first!
echo ==========================================
echo.

cd /d "%CD%\frontend"
npm run dev

pause
