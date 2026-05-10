@echo off
chcp 65001 >nul
echo ==========================================
echo   HandyLand - Starting All Services
echo ==========================================
echo.

echo [1/4] Cleaning up old processes on ports 5000, 3000, 3001...
for %%P in (5000 3000 3001) do (
    for /f "tokens=5" %%i in ('netstat -ano 2^>nul ^| findstr ":%%P "') do (
        taskkill /F /PID %%i >nul 2>&1
    )
)
echo       Done. Ports are now free.
echo.

echo [2/4] Checking Supabase cloud connection...
node -e "require('dotenv').config({path:'backend/.env'}); const {createClient}=require('./backend/node_modules/@supabase/supabase-js'); const s=createClient(process.env.SUPABASE_URL,process.env.SUPABASE_SERVICE_KEY); s.from('products').select('id').limit(1).then(r=>{ if(r.error){console.log('  [ERROR] Supabase connection failed: '+r.error.message); process.exit(1);} else {console.log('  [OK] Supabase database is online and reachable.');}});" 2>nul
echo.

echo [3/4] Launching services in separate windows...
echo.

echo       Starting Backend    (http://localhost:5000)
start "HandyLand Backend"    cmd /k "cd /d %~dp0backend && npm run dev"

timeout /t 2 /nobreak >nul

echo       Starting Admin Panel (http://localhost:3001)
start "HandyLand Admin"      cmd /k "cd /d %~dp0backend\admin && npm run dev"

echo       Starting Frontend   (http://localhost:3000)
start "HandyLand Frontend"   cmd /k "cd /d %~dp0front-end && npm run dev"

echo.
echo [4/4] All services launched successfully!
echo ==========================================
echo   Backend:     http://localhost:5000
echo   Admin Panel: http://localhost:3001
echo   Frontend:    http://localhost:3000
echo   Database:    Supabase Cloud (always on)
echo ==========================================
echo.
pause
