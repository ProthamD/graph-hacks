# BlastRadius Quick Start (Windows PowerShell)
Write-Host "======================================================" -ForegroundColor Cyan
Write-Host "  BlastRadius -- FalkorDB Graph Hacks Setup" -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

# 1. Check Docker & Start services if available
Write-Host "[1/4] Checking Docker status..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerRunning = $true
        Write-Host "  -> Docker daemon is active. Starting FalkorDB + MCP containers..." -ForegroundColor Green
        docker-compose up -d
        Write-Host "  -> Waiting for FalkorDB to be healthy..."
        Start-Sleep -Seconds 6
        Write-Host "  -> Bootstrapping FalkorDB schema..."
        python backend/graph_schema.py
        Write-Host "  -> Seeding demo dataset..."
        python backend/seeds/seed_demo.py
    }
} catch {
    $dockerRunning = $false
}

if (-not $dockerRunning) {
    Write-Host "  [Note] Docker Desktop is not currently running." -ForegroundColor Yellow
    Write-Host "         BlastRadius will run in resilient offline demo mode!" -ForegroundColor Yellow
    Write-Host "         (To use live FalkorDB, start Docker Desktop and re-run this script)" -ForegroundColor DarkGray
}

# 2. Verify Python dependencies
Write-Host "[2/4] Verifying Python backend dependencies..." -ForegroundColor Yellow
pip install -r backend/requirements.txt -q

# 3. Start Backend API Server
Write-Host "[3/4] Starting backend API on http://localhost:8090..." -ForegroundColor Yellow
Start-Process python -ArgumentList "backend/api_server.py" -NoNewWindow

# 4. Summary & Frontend Launch
Write-Host "[4/4] Starting Next.js frontend dev server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  BlastRadius is Ready!" -ForegroundColor Green
Write-Host "======================================================" -ForegroundColor Green
Write-Host "  * Backend API:       http://localhost:8090" -ForegroundColor Cyan
Write-Host "  * FalkorDB Browser:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  * Next.js Frontend:  http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To launch the frontend, run:" -ForegroundColor White
Write-Host "  cd frontend; npm run dev" -ForegroundColor Yellow
Write-Host "======================================================" -ForegroundColor Green
