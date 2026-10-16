#!/usr/bin/env bash
# BlastRadius Quick Start Script
set -e

echo "🔥 BlastRadius — FalkorDB Graph Hacks Setup"
echo "============================================="

# 1. Start Docker services
echo "[1/5] Starting FalkorDB + MCP services..."
docker-compose up -d
echo "Waiting for FalkorDB to be healthy..."
sleep 8

# 2. Install Python dependencies
echo "[2/5] Installing Python backend..."
cd backend
pip install -r requirements.txt -q
cd ..

# 3. Bootstrap schema + seed demo data
echo "[3/5] Bootstrapping FalkorDB schema..."
python backend/graph_schema.py

echo "[4/5] Seeding demo dataset..."
python backend/seeds/seed_demo.py

# 4. Start backend API
echo "[5/5] Starting backend API server (port 8090)..."
cd backend
uvicorn api_server:app --host 0.0.0.0 --port 8090 --reload &
cd ..

echo ""
echo "✅ BlastRadius is ready!"
echo "   Backend API:      http://localhost:8090"
echo "   FalkorDB Browser: http://localhost:3000"
echo "   Frontend:         cd frontend && npm run dev"
echo ""
echo "Run: cd frontend && npm install && npm run dev"
