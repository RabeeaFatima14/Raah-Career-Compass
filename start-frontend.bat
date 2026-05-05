@echo off
title Raah Career Compass - Frontend
echo ============================================
echo   Raah Career Compass - Frontend Server
echo ============================================
echo.
echo Starting frontend on http://localhost:3000 ...
echo Keep this window open while using the app.
echo.

set "PATH=C:\Users\Hp\raah-career-compass\nodejs;%PATH%"
cd /d "C:\Users\Hp\raah-career-compass\frontend"
npm.cmd run dev

pause
