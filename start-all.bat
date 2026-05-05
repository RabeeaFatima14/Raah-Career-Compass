@echo off
title Raah Career Compass - Launcher
echo ============================================
echo   Raah Career Compass - Starting All Services
echo ============================================
echo.

echo [1/2] Starting Backend...
start "Raah Backend" cmd /k "cd /d C:\Users\Hp\raah-career-compass\backend && py main.py"

timeout /t 2 /nobreak >nul

echo [2/2] Starting Frontend...
start "Raah Frontend" cmd /k "set PATH=C:\Users\Hp\raah-career-compass\nodejs;%PATH% && cd /d C:\Users\Hp\raah-career-compass\frontend && npm.cmd run dev"

echo.
echo Both servers are starting in separate windows.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:8000
echo.
timeout /t 4 /nobreak >nul
start http://localhost:3000

exit
