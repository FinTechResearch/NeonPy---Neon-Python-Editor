@echo off
rem NeonPy production launcher (Windows)
cd /d "%~dp0.."
npm install --no-audit --no-fund
npm run build
npm start
