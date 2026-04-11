# Quick Start Script for Exam Management Module
# Run this script from the exam-module directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI-Powered Exam Management Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if a command exists
function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

$pythonInstalled = Test-Command "python"
$nodeInstalled = Test-Command "node"
$pgInstalled = Test-Command "psql"

if (-not $pythonInstalled) {
    Write-Host "❌ Python not found. Please install Python 3.9+" -ForegroundColor Red
    exit 1
}

if (-not $nodeInstalled) {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    exit 1
}

if (-not $pgInstalled) {
    Write-Host "⚠️  PostgreSQL not found. Please install PostgreSQL 13+" -ForegroundColor Yellow
    Write-Host "   Download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
}

Write-Host "✅ Prerequisites check complete" -ForegroundColor Green
Write-Host ""

# Setup Backend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Backend (FastAPI)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location backend

# Create virtual environment
Write-Host "Creating Python virtual environment..." -ForegroundColor Yellow
python -m venv venv

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
.\venv\Scripts\Activate.ps1

# Install dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Yellow
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "✅ Backend setup complete" -ForegroundColor Green
Write-Host ""

# Setup Frontend
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setting up Frontend (React)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location ..\frontend

Write-Host "Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

Write-Host "✅ Frontend setup complete" -ForegroundColor Green
Write-Host ""

# Instructions
Set-Location ..

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Create PostgreSQL database:" -ForegroundColor White
Write-Host "   psql -U postgres" -ForegroundColor Cyan
Write-Host "   CREATE DATABASE exam_db;" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Configure backend/.env file:" -ForegroundColor White
Write-Host "   - Set DATABASE_URL" -ForegroundColor Cyan
Write-Host "   - Set GROQ_API_KEY (get from console.groq.com)" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Initialize database:" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Cyan
Write-Host "   .\venv\Scripts\Activate.ps1" -ForegroundColor Cyan
Write-Host "   python init_db.py" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Start servers:" -ForegroundColor White
Write-Host "   Backend:  cd backend && uvicorn app.main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host "   Frontend: cd frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Yellow
Write-Host "   • Backend API:  http://localhost:8000" -ForegroundColor Cyan
Write-Host "   • API Docs:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "   • Frontend:     http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "For detailed instructions, see SETUP_GUIDE.md" -ForegroundColor Green
Write-Host ""
