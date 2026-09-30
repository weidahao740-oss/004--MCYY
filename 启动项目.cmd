@echo off
setlocal EnableExtensions

title Morrow Project Launcher
set "PROJECT_DIR=%~dp0english-pet"
set "FRONTEND_URL=http://localhost:5173"
set "BACKEND_URL=http://localhost:8787/health"
set "AUTO_OPEN=1"

if /I "%~1"=="--no-open" set "AUTO_OPEN=0"

if not exist "%PROJECT_DIR%\package.json" (
  echo [ERROR] Project package.json was not found at:
  echo %PROJECT_DIR%\package.json
  pause
  exit /b 1
)

where node.exe >nul 2>&1
if errorlevel 1 (
  echo [ERROR] Node.js was not found. Install Node.js 22 or later.
  pause
  exit /b 1
)

where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo [ERROR] npm was not found. Check the Node.js installation.
  pause
  exit /b 1
)

if not exist "%PROJECT_DIR%\node_modules" (
  echo [SETUP] Installing project dependencies...
  pushd "%PROJECT_DIR%"
  call npm.cmd install
  if errorlevel 1 (
    popd
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
  popd
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 8787 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [START] API: http://localhost:8787
  start "Morrow API" /D "%PROJECT_DIR%" cmd.exe /k npm.cmd run dev:api
) else (
  echo [SKIP] Port 8787 already has a listening service.
)

powershell.exe -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5173 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if errorlevel 1 (
  echo [START] Web: http://localhost:5173
  start "Morrow Web" /D "%PROJECT_DIR%" cmd.exe /k npm.cmd run dev:web
) else (
  echo [SKIP] Port 5173 already has a listening service.
)

echo [WAIT] Waiting for API and Web readiness...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$targets=@('http://localhost:8787/health','http://localhost:5173'); $deadline=(Get-Date).AddSeconds(60); $pending=[System.Collections.Generic.HashSet[string]]::new([string[]]$targets); while($pending.Count -gt 0 -and (Get-Date) -lt $deadline){ foreach($url in @($pending)){ try { $response=Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 2; if($response.StatusCode -ge 200 -and $response.StatusCode -lt 500){ [void]$pending.Remove($url) } } catch {} }; if($pending.Count -gt 0){ Start-Sleep -Milliseconds 500 } }; if($pending.Count -gt 0){ Write-Host ('[ERROR] Services not ready: ' + (($pending | Sort-Object) -join ', ')); exit 1 }; Write-Host '[READY] API and Web are ready.'"
if errorlevel 1 (
  echo Review the Morrow API and Morrow Web windows for errors.
  pause
  exit /b 1
)

if "%AUTO_OPEN%"=="1" (
  start "" "%FRONTEND_URL%"
  start "" "%BACKEND_URL%"
  echo [DONE] Opened the frontend and backend health pages.
) else (
  echo [DONE] Browser launch skipped by --no-open.
)

exit /b 0
