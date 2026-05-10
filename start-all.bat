@echo off
title HandyLand - All-in-One Starter
echo.
echo    🚀 Starting HandyLand Ecosystem...
echo.

:: Clean up ports to avoid EADDRINUSE errors
echo    [0/3] Clearing ports 5000, 3001, 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do taskkill /f /pid %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do taskkill /f /pid %%a >nul 2>&1
echo          Done.

:: Start Backend (API)
echo    [1/3] Launching Backend on PORT 5000...
start "HandyLand - Backend" cmd /k "cd backend && npm run dev"

:: Start Admin Panel
echo    [2/3] Launching Admin Panel on PORT 3001...
start "HandyLand - Admin" cmd /k "cd backend/admin && npm run dev"

:: Start Frontend (Client)
echo    [3/3] Launching Frontend on PORT 3000...
start "HandyLand - Frontend" cmd /k "cd front-end && npm run dev"

echo.
echo    ✨ All services are launching in separate windows.
echo    🔗 Backend:   http://localhost:5000
echo    🔗 Admin:     http://localhost:3001
echo    🔗 Frontend:  http://localhost:3000
echo.
pause
