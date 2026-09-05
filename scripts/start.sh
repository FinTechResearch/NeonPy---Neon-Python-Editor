#!/usr/bin/env bash
# NeonPy production launcher (Linux/macOS)
set -e
cd "$(dirname "$0")/.."
npm install --no-audit --no-fund
npm run build
npm start
