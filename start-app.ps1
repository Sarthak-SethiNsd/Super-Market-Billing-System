<#
.SYNOPSIS
    One-command Windows launcher for the Supermarket Billing & Inventory Management System.

.DESCRIPTION
    Checks prerequisites, optionally builds missing artifacts with user confirmation,
    securely collects ADMIN_INITIAL_PASSWORD on first database initialization,
    sets explicit backend process environment variables, launches both backend and
    frontend servers cleanly, opens the browser, and tears down child process trees on Ctrl+C.

.PARAMETER DbPath
    Optional SQLite database file path. Defaults to backend\data\supermarket.db.

.PARAMETER Port
    Optional backend HTTP port. Defaults to PORT environment variable or 8080.

.PARAMETER BindHost
    Optional backend bind address. Defaults to HOST environment variable or 127.0.0.1 (local-only).

.PARAMETER CorsAllowedOrigin
    Optional CORS origin for the backend. Defaults to CORS_ALLOWED_ORIGIN or http://localhost:5173.

.PARAMETER SessionDurationSeconds
    Optional admin token lifetime in seconds. Defaults to 3600.

.PARAMETER NoBrowser
    Suppress automatically opening http://localhost:5173 in the default browser.
#>

[CmdletBinding()]
param(
    [string]$DbPath = '',
    [int]$Port = 0,
    [string]$BindHost = '',
    [string]$CorsAllowedOrigin = '',
    [int]$SessionDurationSeconds = 3600,
    [switch]$NoBrowser
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Find-ToolPath {
    param(
        [string]$ExecutableName,
        [string[]]$FallbackPatterns
    )
    $cmd = Get-Command $ExecutableName -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($cmd -and $cmd.Source) {
        return $cmd.Source
    }
    foreach ($pattern in $FallbackPatterns) {
        $matches = Get-Item -Path $pattern -ErrorAction SilentlyContinue | Sort-Object FullName -Descending
        if ($matches) {
            return $matches[0].FullName
        }
    }
    return $null
}

function Test-MsvcAvailable {
    if (Get-Command cl.exe -ErrorAction SilentlyContinue) { return $true }
    $patterns = @(
        "${env:ProgramFiles}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\bin\Host*\x64\cl.exe",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\bin\Host*\x64\cl.exe"
    )
    foreach ($p in $patterns) {
        if (Get-Item -Path $p -ErrorAction SilentlyContinue | Select-Object -First 1) { return $true }
    }
    return $false
}

function Test-PortInUse {
    param([int]$CheckPort)
    $conn = Get-NetTCPConnection -LocalPort $CheckPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
    return ($null -ne $conn)
}

function Stop-ProcessTree {
    param([System.Diagnostics.Process]$ProcessObj)
    if ($null -eq $ProcessObj) { return }
    try {
        if (-not $ProcessObj.HasExited) {
            & taskkill.exe /PID $ProcessObj.Id /T /F 2>$null | Out-Null
            if (-not $ProcessObj.HasExited) {
                $ProcessObj.Kill()
            }
            $ProcessObj.WaitForExit(3000) | Out-Null
        }
    } catch {
        try {
            if (-not $ProcessObj.HasExited) {
                $ProcessObj.Kill()
                $ProcessObj.WaitForExit(3000) | Out-Null
            }
        } catch {}
    }
}

function ConvertFrom-SecureToPlain {
    param([Security.SecureString]$SecureValue)
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}

if ($env:OS -ne 'Windows_NT') {
    Write-Error "This startup script supports Windows only (MSVC + Windows CNG backend)."
    exit 1
}

$ProjectRoot   = $PSScriptRoot
$BackendDir    = Join-Path $ProjectRoot 'backend'
$FrontendDir   = Join-Path $ProjectRoot 'frontend'
$ServerExe     = Join-Path $BackendDir 'build\Release\supermarket_server.exe'
$NodeModules   = Join-Path $FrontendDir 'node_modules'

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Supermarket Billing & Inventory Management System" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# 1. Prerequisite Checks
$cmakePath = Find-ToolPath -ExecutableName 'cmake.exe' -FallbackPatterns @(
    "${env:ProgramFiles}\CMake\bin\cmake.exe",
    "${env:ProgramFiles}\Microsoft Visual Studio\*\*\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
)
$msvcOk  = Test-MsvcAvailable
$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
$npmCmd  = Get-Command npm.cmd  -ErrorAction SilentlyContinue | Select-Object -First 1

if (-not $cmakePath -or -not $msvcOk) {
    Write-Host "[ERROR] CMake and/or Visual Studio 2022 MSVC Build Tools were not detected." -ForegroundColor Red
    Write-Host "        Please install Visual Studio Build Tools (Desktop development with C++)."
    exit 1
}
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "[ERROR] Node.js and npm were not detected on PATH. Please install Node.js LTS." -ForegroundColor Red
    exit 1
}

# 2. Check / Offer Build for Missing Backend Executable
if (-not (Test-Path $ServerExe)) {
    Write-Host "[INFO] Backend executable not found at: $ServerExe" -ForegroundColor Yellow
    $answer = Read-Host "Build C++ backend now using CMake Release? (Y/N)"
    if ($answer -match '^[Yy]') {
        Push-Location $BackendDir
        try {
            & $cmakePath -B build -S .
            if ($LASTEXITCODE -ne 0) { throw "CMake configure failed." }
            & $cmakePath --build build --config Release
            if ($LASTEXITCODE -ne 0) { throw "CMake build failed." }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "Aborted. Run .\build-and-test.ps1 first to compile the backend." -ForegroundColor Red
        exit 1
    }
}

# 3. Check / Offer Install for Missing Frontend node_modules
if (-not (Test-Path $NodeModules)) {
    Write-Host "[INFO] Frontend dependencies missing at: $NodeModules" -ForegroundColor Yellow
    $answer = Read-Host "Run 'npm ci' in frontend/ now? (Y/N)"
    if ($answer -match '^[Yy]') {
        Push-Location $FrontendDir
        try {
            & $npmCmd.Source ci
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed." }
        } finally {
            Pop-Location
        }
    } else {
        Write-Host "Aborted. Run 'npm ci' inside frontend/ before starting." -ForegroundColor Red
        exit 1
    }
}

# 4. Resolve Network & Database Settings
$envPort = [Environment]::GetEnvironmentVariable('PORT')
if ($Port -le 0) {
    if ($envPort -and ($envPort -as [int]) -gt 0) { $Port = [int]$envPort } else { $Port = 8080 }
}

$envHost = [Environment]::GetEnvironmentVariable('HOST')
if ([string]::IsNullOrWhiteSpace($BindHost)) {
    if (-not [string]::IsNullOrWhiteSpace($envHost)) { $BindHost = $envHost.Trim() } else { $BindHost = '127.0.0.1' }
}

$envCors = [Environment]::GetEnvironmentVariable('CORS_ALLOWED_ORIGIN')
if ([string]::IsNullOrWhiteSpace($CorsAllowedOrigin)) {
    if (-not [string]::IsNullOrWhiteSpace($envCors)) { $CorsAllowedOrigin = $envCors } else { $CorsAllowedOrigin = 'http://localhost:5173' }
}

$envDb = [Environment]::GetEnvironmentVariable('DB_PATH')
if ([string]::IsNullOrWhiteSpace($DbPath)) {
    if (-not [string]::IsNullOrWhiteSpace($envDb)) { $DbPath = $envDb } else { $DbPath = Join-Path $BackendDir 'data\supermarket.db' }
}
if (-not [System.IO.Path]::IsPathRooted($DbPath)) {
    $DbPath = [System.IO.Path]::GetFullPath((Join-Path $BackendDir $DbPath))
}

$FrontendUrl = 'http://localhost:5173'
if (Test-PortInUse -CheckPort $Port) {
    Write-Host "[ERROR] Port $Port is already in use. Stop the conflicting process or pass -Port." -ForegroundColor Red
    exit 1
}
if (Test-PortInUse -CheckPort 5173) {
    Write-Host "[ERROR] Frontend port 5173 is already in use (Vite requires strict port 5173)." -ForegroundColor Red
    exit 1
}

# 5. Database & Admin Initial Password Handling (Zero hardcoded passwords, zero echo)
$adminPlain = [Environment]::GetEnvironmentVariable('ADMIN_INITIAL_PASSWORD')
$dbExists   = Test-Path $DbPath

if (-not $dbExists) {
    Write-Host "[SETUP] Fresh SQLite database will be created at:" -ForegroundColor Cyan
    Write-Host "        $DbPath"
    while ([string]::IsNullOrEmpty($adminPlain) -or $adminPlain.Length -lt 6) {
        if (-not [string]::IsNullOrEmpty($adminPlain)) {
            Write-Host "[WARN] Administrator password must be at least 6 characters long." -ForegroundColor Yellow
        }
        $sec = Read-Host "Enter initial Administrator password (min 6 chars, input hidden)" -AsSecureString
        $adminPlain = ConvertFrom-SecureToPlain -SecureValue $sec
        $sec.Dispose()
    }
} else {
    Write-Host "[INFO] Existing SQLite database found at: $DbPath" -ForegroundColor Green
    Write-Host "       Stored Admin credentials (if already initialized) will be preserved and NOT overwritten."
    Write-Host "       Note: No automatic password reset utility exists; to start fresh cleanly, back up and move the .db files."
}

$backendProc  = $null
$frontendProc = $null
$tempDir      = [System.IO.Path]::GetTempPath()
$bOutLog      = Join-Path $tempDir "sms_backend_out_$PID.log"
$bErrLog      = Join-Path $tempDir "sms_backend_err_$PID.log"
$fOutLog      = Join-Path $tempDir "sms_frontend_out_$PID.log"
$fErrLog      = Join-Path $tempDir "sms_frontend_err_$PID.log"

$prevEnv = @{
    PORT                     = [Environment]::GetEnvironmentVariable('PORT')
    HOST                     = [Environment]::GetEnvironmentVariable('HOST')
    CORS_ALLOWED_ORIGIN      = [Environment]::GetEnvironmentVariable('CORS_ALLOWED_ORIGIN')
    DB_PATH                  = [Environment]::GetEnvironmentVariable('DB_PATH')
    SESSION_DURATION_SECONDS = [Environment]::GetEnvironmentVariable('SESSION_DURATION_SECONDS')
    ADMIN_INITIAL_PASSWORD   = [Environment]::GetEnvironmentVariable('ADMIN_INITIAL_PASSWORD')
    VITE_API_BASE_URL        = [Environment]::GetEnvironmentVariable('VITE_API_BASE_URL')
}

try {
    # 6. Set Process Environment Variables Directly & Launch C++ Backend
    $env:PORT                     = "$Port"
    $env:HOST                     = $BindHost
    $env:CORS_ALLOWED_ORIGIN      = $CorsAllowedOrigin
    $env:DB_PATH                  = $DbPath
    $env:SESSION_DURATION_SECONDS = "$SessionDurationSeconds"
    if (-not [string]::IsNullOrEmpty($adminPlain)) {
        $env:ADMIN_INITIAL_PASSWORD = $adminPlain
    }
    $adminPlain = $null

    $healthHost = if ($BindHost -eq '0.0.0.0') { '127.0.0.1' } else { $BindHost }
    Write-Host ""
    Write-Host "[START] Launching C++ REST API on http://${BindHost}:$Port ..." -ForegroundColor Cyan
    $backendProc = Start-Process -FilePath $ServerExe `
        -WorkingDirectory $BackendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $bOutLog `
        -RedirectStandardError $bErrLog `
        -PassThru

    # Clear sensitive variable from parent shell immediately after spawn
    [Environment]::SetEnvironmentVariable('ADMIN_INITIAL_PASSWORD', $null, 'Process')

    # Wait for Backend /api/health
    $healthUrl = "http://${healthHost}:$Port/api/health"
    $backendReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        if ($backendProc.HasExited) {
            $errText = if (Test-Path $bErrLog) { Get-Content -Path $bErrLog -Raw -ErrorAction SilentlyContinue } else { '' }
            throw "Backend exited prematurely (code $($backendProc.ExitCode)). $errText"
        }
        try {
            $resp = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }
    if (-not $backendReady) {
        throw "Backend did not respond at $healthUrl within timeout."
    }
    Write-Host "[OK] C++ Backend healthy at $healthUrl" -ForegroundColor Green

    # 7. Launch Vite Frontend Dev Server
    $env:VITE_API_BASE_URL = "http://localhost:$Port"

    Write-Host "[START] Launching React + Vite frontend on $FrontendUrl ..." -ForegroundColor Cyan
    $frontendProc = Start-Process -FilePath $npmCmd.Source `
        -ArgumentList 'run', 'dev' `
        -WorkingDirectory $FrontendDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput $fOutLog `
        -RedirectStandardError $fErrLog `
        -PassThru

    $frontendReady = $false
    for ($i = 0; $i -lt 40; $i++) {
        if ($frontendProc.HasExited) {
            $fErr = if (Test-Path $fErrLog) { Get-Content -Path $fErrLog -Raw -ErrorAction SilentlyContinue } else { '' }
            throw "Frontend server exited prematurely (code $($frontendProc.ExitCode)). $fErr"
        }
        try {
            $resp = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 2
            if ($resp.StatusCode -eq 200) {
                $frontendReady = $true
                break
            }
        } catch {
            Start-Sleep -Milliseconds 300
        }
    }
    if (-not $frontendReady) {
        throw "Frontend server did not respond at $FrontendUrl within timeout."
    }
    Write-Host "[OK] Frontend ready at $FrontendUrl" -ForegroundColor Green

    if (-not $NoBrowser) {
        Start-Process $FrontendUrl | Out-Null
    }

    Write-Host ""
    Write-Host "Application is running:" -ForegroundColor Green
    Write-Host "  Web UI   : $FrontendUrl"
    Write-Host "  API Base : http://localhost:$Port"
    Write-Host "  Database : $DbPath"
    Write-Host "Press Ctrl+C to stop both servers cleanly (database files are preserved)." -ForegroundColor Yellow
    Write-Host ""

    while (-not $backendProc.HasExited -and -not $frontendProc.HasExited) {
        Start-Sleep -Milliseconds 500
    }

    if ($backendProc.HasExited) {
        $bErr = if (Test-Path $bErrLog) { Get-Content -Path $bErrLog -Raw -ErrorAction SilentlyContinue } else { '' }
        Write-Host "[ERROR] Backend server stopped unexpectedly (exit code $($backendProc.ExitCode)). $bErr" -ForegroundColor Red
        exit 1
    }
    if ($frontendProc.HasExited) {
        $fErr = if (Test-Path $fErrLog) { Get-Content -Path $fErrLog -Raw -ErrorAction SilentlyContinue } else { '' }
        Write-Host "[ERROR] Frontend server stopped unexpectedly (exit code $($frontendProc.ExitCode)). $fErr" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
} finally {
    $adminPlain = $null
    Write-Host ""
    Write-Host "[STOP] Shutting down application servers (preserving database)..." -ForegroundColor Yellow
    Stop-ProcessTree -ProcessObj $frontendProc
    Stop-ProcessTree -ProcessObj $backendProc
    foreach ($k in $prevEnv.Keys) {
        [Environment]::SetEnvironmentVariable($k, $prevEnv[$k], 'Process')
    }
    Remove-Item -Force -ErrorAction SilentlyContinue $bOutLog, $bErrLog, $fOutLog, $fErrLog
    Write-Host "[DONE] Servers stopped cleanly." -ForegroundColor Green
}
