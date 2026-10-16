# BlastRadius Quick Start (Windows PowerShell)
Write-Host "BlastRadius -- FalkorDB Graph Hacks Setup" -ForegroundColor Cyan

# 1. Start Docker services
Write-Host "[1/5] Starting FalkorDB + MCP services..."
docker-compose up -d
Start-Sleep -Seconds 10

# 2. Install Python deps
Write-Host "[2/5] Installing Python backend..."
Set-Location backend
pip install -r requirements.txt -q
Set-Location ..

# 3. Bootstrap + seed
Write-Host "[3/5] Bootstrapping FalkorDB schema..."
python backend/graph_schema.py

Write-Host "[4/5] Seeding demo dataset..."
python backend/seeds/seed_demo.py

# 4. Start API (background)
Write-Host "[5/5] Starting backend API on :8090..."
Start-Process python -ArgumentList "backend/api_server.py" -NoNewWindow

Write-Host ""
Write-Host "BlastRadius is ready!" -ForegroundColor Green
Write-Host "  Backend API:      http://localhost:8090" -ForegroundColor Yellow
Write-Host "  FalkorDB Browser: http://localhost:3000" -ForegroundColor Yellow
Write-Host "  Frontend: cd frontend && npm install && npm run dev" -ForegroundColor Yellow
