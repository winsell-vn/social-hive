@echo off
echo ========================================
echo   Redis Server Startup Script (Windows)
echo ========================================
echo.

REM Determine Redis path.
REM   1. REDIS_HOME environment variable (recommended - set it explicitly).
REM   2. .\Redis next to this script.
REM   3. ..\Redis (parent of this repository).
set "REDIS_PATH="

if defined REDIS_HOME (
    set "REDIS_PATH=%REDIS_HOME%"
) else if exist "%~dp0Redis\redis-server.exe" (
    set "REDIS_PATH=%~dp0Redis"
) else if exist "%~dp0..\Redis\redis-server.exe" (
    set "REDIS_PATH=%~dp0..\Redis"
)

if not defined REDIS_PATH (
    echo ERROR: Could not locate redis-server.exe
    echo Set the REDIS_HOME environment variable to the folder that contains
    echo redis-server.exe, then run this script again.
    exit /b 1
)

echo Using Redis path: %REDIS_PATH%
echo.

echo Stopping any existing Redis instances...

REM Try graceful shutdown first
redis-cli shutdown 2>nul
timeout /t 2 /nobreak >nul

REM Check if still running, try normal taskkill
tasklist /FI "IMAGENAME eq redis-server.exe" 2>nul | find /I "redis-server.exe" >nul
if %ERRORLEVEL%==0 (
    echo Graceful shutdown failed, trying taskkill...
    taskkill /IM redis-server.exe 2>nul
    timeout /t 2 /nobreak >nul
)

REM Last resort: force kill
tasklist /FI "IMAGENAME eq redis-server.exe" 2>nul | find /I "redis-server.exe" >nul
if %ERRORLEVEL%==0 (
    echo Normal taskkill failed, forcing termination...
    taskkill /IM redis-server.exe /F 2>nul
    timeout /t 1 /nobreak >nul
)

echo Starting Redis Server...

REM Verify target directory exists
if not exist "%REDIS_PATH%" (
    echo ERROR: Redis directory not found: %REDIS_PATH%
    exit /b 1
)

cd /d "%REDIS_PATH%"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to change to Redis directory: %REDIS_PATH%
    exit /b 1
)

redis-server.exe redis.windows.conf
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to start Redis server
    exit /b 1
)
