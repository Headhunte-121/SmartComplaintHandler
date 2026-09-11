@echo off
setlocal enabledelayedexpansion

title Smart Complaint Handler - Full-Stack Launcher
color 0B

echo ===============================================================================
echo        SMART COMPLAINT ROUTING ^& WORKFLOW AUTOMATION PLATFORM (V1)
echo ===============================================================================
echo.

:: Extract root directory path of this script
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"
set "FRONTEND_DIR=%ROOT_DIR%frontend"

echo [*] Project Root Directory: %ROOT_DIR%
echo.

:: -----------------------------------------------------------------------------
:: 1. BACKEND VERIFICATION & STARTUP
:: -----------------------------------------------------------------------------
echo [*] Checking Backend virtual environment...
if not exist "%BACKEND_DIR%\venv\Scripts\activate.bat" (
    echo [!] Python virtual environment not found in backend\venv.
    echo [*] Creating virtual environment...
    cd /d "%BACKEND_DIR%"
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create Python virtual environment. Please ensure Python 3.10+ is installed.
        pause
        exit /b 1
    )
    echo [*] Installing backend dependencies from requirements.txt...
    call ".\venv\Scripts\pip" install -r requirements.txt
    cd /d "%ROOT_DIR%"
)

echo [+] Backend virtual environment is ready.
echo [*] Launching FastAPI Backend on port 8000...

start "SmartComplaintHandler - Backend (FastAPI :8000)" /D "%BACKEND_DIR%" cmd /k "call .\venv\Scripts\activate.bat && echo ==================================================== && echo   BACKEND SERVER RUNNING AT http://localhost:8000   && echo   INTERACTIVE API DOCS AT http://localhost:8000/docs && echo ==================================================== && uvicorn app.main:app --reload --port 8000"

:: -----------------------------------------------------------------------------
:: 2. FRONTEND VERIFICATION & STARTUP
:: -----------------------------------------------------------------------------
echo [*] Checking Frontend dependencies...
if not exist "%FRONTEND_DIR%\node_modules" (
    echo [!] Frontend node_modules not found.
    echo [*] Installing dependencies with npm install...
    cd /d "%FRONTEND_DIR%"
    call npm install
    cd /d "%ROOT_DIR%"
)

echo [+] Frontend dependencies are ready.
echo [*] Launching Vite React Frontend on port 5173...

start "SmartComplaintHandler - Frontend (React Vite :5173)" /D "%FRONTEND_DIR%" cmd /k "echo ==================================================== && echo   FRONTEND APP RUNNING AT http://localhost:5173    && echo ==================================================== && npm run dev"

:: -----------------------------------------------------------------------------
:: 3. BROWSER LAUNCH & STATUS SUMMARY
:: -----------------------------------------------------------------------------
echo.
echo [*] Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul

echo [*] Opening application in default web browser...
start http://localhost:5173
start http://localhost:8000/docs

echo.
echo ===============================================================================
echo                    SYSTEM RUNNING AUTOMATICALLY!
echo ===============================================================================
echo   Frontend Web Client:   http://localhost:5173
echo   Backend API Server:    http://localhost:8000
echo   Swagger Documentation: http://localhost:8000/docs
echo   Health Check:          http://localhost:8000/health
echo ===============================================================================
echo.
echo [i] Two dedicated terminal windows have been launched:
echo       1. Backend:  FastAPI / Uvicorn server logs (:8000)
echo       2. Frontend: Vite hot-module reload logs (:5173)
echo.
echo [i] To stop the platform: Run 'stop_all.bat' or close the terminal windows.
echo.
pause
