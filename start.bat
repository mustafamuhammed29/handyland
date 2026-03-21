@echo off
echo =========================================
echo Starting HandyLand Services...
echo =========================================

echo Starting Backend...
start "HandyLand Backend" cmd /k "cd backend && npm run dev"

echo Starting Admin Panel...
start "HandyLand Admin" cmd /k "cd backend\admin && npm run dev"

echo Starting Frontend...
start "HandyLand Frontend" cmd /k "cd front-end && npm run dev"

echo All services have been launched in separate windows!
