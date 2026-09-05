@echo off
rem NeonPy dev launcher (Windows)
cd /d "%~dp0.."
echo NeonPy - installing dependencies (first run only)...
npm install --no-audit --no-fund
echo Starting NeonPy dev server on http://localhost:3000
npm run dev
