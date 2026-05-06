# Raah Career Compass - PowerShell Start Script (Windows)
# Usage: .\start-all.ps1
# Note: Run PowerShell as Administrator for best results

Write-Host "===========================================" -ForegroundColor Green
Write-Host "  Raah Career Compass - Starting Services" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""

# Function to cleanup on exit
$cleanup = {
    Write-Host ""
    Write-Host "Shutting down services..." -ForegroundColor Yellow
}
$ErrorActionPreference = "Stop"

# Check if backend and frontend directories exist
if (-not (Test-Path "backend") -or -not (Test-Path "frontend")) {
    Write-Host "❌ Error: backend/ or frontend/ directory not found" -ForegroundColor Red
    Write-Host "Make sure you're running this from the project root directory"
    exit 1
}

# Check Python availability
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python not found. Please install Python 3.10+" -ForegroundColor Red
    exit 1
}

# Check Node.js availability
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start Backend
Write-Host "[1/2] Starting Backend on port 8000..." -ForegroundColor Yellow
Push-Location backend

if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv venv
}

& ".\venv\Scripts\Activate.ps1" 2>$null

if (-not (Test-Path "venv\Scripts\uvicorn.exe")) {
    Write-Host "Installing dependencies..."
    pip install -q -r requirements.txt
}

# Start backend in a separate process
$backendProcess = Start-Process python -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" -PassThru
Write-Host "✓ Backend started (PID: $($backendProcess.Id))" -ForegroundColor Green
Start-Sleep -Seconds 2

Pop-Location

# Start Frontend
Write-Host "[2/2] Starting Frontend on port 3000..." -ForegroundColor Yellow
Push-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing Node dependencies..."
    npm install -q
}

# Start frontend in a separate process
$frontendProcess = Start-Process npm -ArgumentList "run dev" -PassThru
Write-Host "✓ Frontend started (PID: $($frontendProcess.Id))" -ForegroundColor Green

Pop-Location

Write-Host ""
Write-Host "===========================================" -ForegroundColor Green
Write-Host "✓ All services are running!" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Frontend: http://localhost:3000"
Write-Host "📍 Backend:  http://localhost:8000"
Write-Host "📍 API Docs: http://localhost:8000/docs"
Write-Host ""
Write-Host "Note: Services are running in separate windows."
Write-Host "Close those windows or press Ctrl+C to stop services."
Write-Host ""

# Keep this window open
Read-Host "Press Enter to exit"
