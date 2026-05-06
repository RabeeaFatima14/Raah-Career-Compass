#!/bin/bash

# Raah Career Compass - Multi-platform Start Script
# Usage: ./start-all.sh or bash start-all.sh

set -e  # Exit on error

echo "==========================================="
echo "  Raah Career Compass - Starting Services"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup on exit
cleanup() {
  echo ""
  echo -e "${YELLOW}Shutting down services...${NC}"
  kill 0 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# Check if backend and frontend directories exist
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  echo -e "${RED}❌ Error: backend/ or frontend/ directory not found${NC}"
  echo "Make sure you're running this from the project root directory"
  exit 1
fi

# Check Python availability
if ! command -v python3 &> /dev/null; then
  echo -e "${RED}❌ Error: Python 3 not found. Please install Python 3.10+${NC}"
  exit 1
fi

# Check Node.js availability
if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Error: Node.js not found. Please install Node.js 18+${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Python and Node.js found${NC}"
echo ""

# Start Backend
echo -e "${YELLOW}[1/2] Starting Backend on port 8000...${NC}"
cd backend

if [ ! -d "venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null || true

if [ ! -f "venv/bin/uvicorn" ] && [ ! -f "venv/Scripts/uvicorn" ]; then
  echo "Installing dependencies..."
  pip install -q -r requirements.txt
fi

python -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"
sleep 2

cd ..

# Start Frontend
echo -e "${YELLOW}[2/2] Starting Frontend on port 3000...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
  echo "Installing Node dependencies..."
  npm install -q
fi

npm run dev &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

cd ..

echo ""
echo "==========================================="
echo -e "${GREEN}✓ All services are running!${NC}"
echo "==========================================="
echo ""
echo "📍 Frontend: http://localhost:3000"
echo "📍 Backend:  http://localhost:8000"
echo "📍 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for processes
wait
