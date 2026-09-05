#!/usr/bin/env bash
# NeonPy dev launcher (Linux/macOS)
set -e
cd "$(dirname "$0")/.."

echo "⚡ NeonPy — installing dependencies (first run only)…"
npm install --no-audit --no-fund

echo "🚀 Starting NeonPy dev server on http://localhost:3000"
npm run dev
