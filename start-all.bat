@echo off
REM Raah Career Compass - Batch Start Script (Windows)
REM This script starts both backend and frontend in separate Command Prompt windows

title Raah Career Compass - Launcher
color 0A
cls

echo ==========================================
echo   Raah Career Compass - Starting Services
echo ==========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    color 0C
    echo ERROR: backend directory not found
    echo Make sure you're running this from the project root directory
    pause
    exit /b 1
)

if not exist "frontend" (
    color 0C
    echo ERROR: frontend directory not found
    echo Make sure you're running this from the project root directory
    pause
    exit /b 1
)

echo [1/2] Starting Backend on port 8000...
start "Raah Backend" cmd /k "cd /d "%CD%\backend" && python -m uvicorn main:app --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak >nul

echo [2/2] Starting Frontend on port 3000...
start "Raah Frontend" cmd /k "cd /d "%CD%\frontend" && npm run dev"

echo.
echo ==========================================
echo Both servers are starting. Window overview:
echo   - Backend window: Python/Uvicorn server (port 8000)
echo   - Frontend window: Vite dev server (port 3000)
echo ==========================================
echo.
echo Open your browser and navigate to:
echo   Frontend: http://localhost:3000
echo   Backend:  http://localhost:8000
echo   API Docs: http://localhost:8000/docs
echo.
echo To stop services, close both windows or press Ctrl+C in each.
echo.
pause
timeout /t 4 /nobreak >nul
start http://localhost:3000

exit
