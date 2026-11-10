@REM @@ -1,56 +0,0 @@
@echo off
echo ========================================
echo   Redis Server Startup Script
echo ========================================
echo.

REM Determine Redis path: REDIS_HOME env var, or default installation path
if defined REDIS_HOME (
    set "REDIS_PATH=%REDIS_HOME%"
) else (
    set "REDIS_PATH=D:\Project\SocialMedia\Redis"
)

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
    echo Set REDIS_HOME environment variable or install Redis at D:\Project\SocialMedia\Redis
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

