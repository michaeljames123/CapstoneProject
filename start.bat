@echo off
echo ==========================================
echo    AgridroneInsight Development Setup
echo ==========================================
echo.

echo Starting Backend Server...
cd backend
start "Backend Server" cmd /k "python app.py"
cd ..

echo.
echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
cd frontend
start "Frontend Server" cmd /k "npm start"
cd ..

echo.
echo ==========================================
echo Both servers are starting...
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo The frontend will open automatically in your browser.
echo ==========================================
pause
