#!/usr/bin/env bash
# BlastRadius Quick Start Script
set -e

echo "🔥 BlastRadius — FalkorDB Graph Hacks Setup"
echo "============================================="

# 1. Start Docker services if running
echo "[1/4] Checking Docker status..."
if docker info >/dev/null 2>&1; then
    echo "  -> Docker daemon is active. Starting FalkorDB + MCP containers..."
    docker-compose up -d
    echo "  -> Waiting for FalkorDB to be healthy..."
    sleep 6
    echo "  -> Bootstrapping FalkorDB schema..."
    python backend/graph_schema.py
    echo "  -> Seeding demo dataset..."
    python backend/seeds/seed_demo.py
else
    echo "  [Note] Docker is not currently running. Running in resilient demo mode."
fi

# 2. Install Python dependencies
echo "[2/4] Verifying Python backend dependencies..."
pip install -r backend/requirements.txt -q

# 3. Start backend API
echo "[3/4] Starting backend API server on port 8090..."
cd backend
python -m uvicorn api_server:app --host 0.0.0.0 --port 8090 --reload &
cd ..

echo ""
echo "============================================="
echo "✅ BlastRadius is ready!"
echo "   Backend API:      http://localhost:8090"
echo "   FalkorDB Browser: http://localhost:3000"
echo "   Frontend:         cd frontend && npm run dev"
echo "============================================="

