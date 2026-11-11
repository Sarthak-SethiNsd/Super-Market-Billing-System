<#
.SYNOPSIS
    Builds and verifies the Supermarket Billing & Inventory Management System on Windows.

.DESCRIPTION
    Resolves all project paths relative to this script, checks host prerequisites
    (Windows OS, CMake, MSVC toolset, Node.js, npm), configures and builds the
    C++17 backend (Release), executes the CTest unit/integration suites, installs
    frontend npm dependencies only when missing or requested via -InstallDependencies,
    and runs the TypeScript + Vite production build.

.PARAMETER InstallDependencies
    Runs `npm ci` in frontend/ even if node_modules/ already exists.
#>

[CmdletBinding()]
param(
    [switch]$InstallDependencies
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "============================================================" -ForegroundColor Cyan
    Write-Host "  $Title" -ForegroundColor Cyan
    Write-Host "============================================================" -ForegroundColor Cyan
}

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
    $clCmd = Get-Command cl.exe -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($clCmd) {
        return $true
    }

    $msvcPatterns = @(
        "${env:ProgramFiles}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\bin\Host*\x64\cl.exe",
        "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\VC\Tools\MSVC\*\bin\Host*\x64\cl.exe"
    )
    foreach ($pattern in $msvcPatterns) {
        $found = Get-Item -Path $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($found) {
            return $true
        }
    }
    return $false
}

$isWin = $env:OS -eq 'Windows_NT'
if (-not $isWin) {
    Write-Error "This project targets Windows (MSVC + Windows CNG bcrypt). Non-Windows hosts are unsupported."
    exit 1
}

$ProjectRoot = $PSScriptRoot
$BackendDir  = Join-Path $ProjectRoot 'backend'
$FrontendDir = Join-Path $ProjectRoot 'frontend'

if (-not (Test-Path (Join-Path $BackendDir 'CMakeLists.txt'))) {
    Write-Error "Backend CMakeLists.txt not found at '$BackendDir'."
    exit 1
}
if (-not (Test-Path (Join-Path $FrontendDir 'package.json'))) {
    Write-Error "Frontend package.json not found at '$FrontendDir'."
    exit 1
}

Write-Section "1. Checking Host Prerequisites"

$cmakePath = Find-ToolPath -ExecutableName 'cmake.exe' -FallbackPatterns @(
    "${env:ProgramFiles}\CMake\bin\cmake.exe",
    "${env:ProgramFiles}\Microsoft Visual Studio\*\*\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe",
    "${env:ProgramFiles(x86)}\Microsoft Visual Studio\*\*\Common7\IDE\CommonExtensions\Microsoft\CMake\CMake\bin\cmake.exe"
)
if (-not $cmakePath) {
    Write-Host "[FAIL] CMake (>= 3.15) was not found. Please install CMake or Visual Studio C++ CMake tools." -ForegroundColor Red
    exit 1
}

$ctestPath = Join-Path (Split-Path -Parent $cmakePath) 'ctest.exe'
if (-not (Test-Path $ctestPath)) {
    $ctestPath = Find-ToolPath -ExecutableName 'ctest.exe' -FallbackPatterns @()
}
if (-not $ctestPath) {
    Write-Host "[FAIL] CTest executable was not found alongside CMake." -ForegroundColor Red
    exit 1
}

if (-not (Test-MsvcAvailable)) {
    Write-Host "[FAIL] Visual Studio MSVC C++ compiler (cl.exe) was not found. Install VS 2022 Build Tools (Desktop development with C++)." -ForegroundColor Red
    exit 1
}

$nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1
$npmCmd  = Get-Command npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $nodeCmd -or -not $npmCmd) {
    Write-Host "[FAIL] Node.js and npm are required on PATH." -ForegroundColor Red
    exit 1
}

$nodeVer = & $nodeCmd.Source -v
$npmVer  = & $npmCmd.Source -v
Write-Host "[OK] CMake : $cmakePath"
Write-Host "[OK] CTest : $ctestPath"
Write-Host "[OK] MSVC  : Available"
Write-Host "[OK] Node  : $nodeVer | npm: $npmVer"

$backendBuildResult  = 'NOT RUN'
$backendCTestResult  = 'NOT RUN'
$frontendBuildResult = 'NOT RUN'
$overallFailed       = $false

Write-Section "2. Configuring & Building C++ Backend (Release)"
Push-Location $BackendDir
try {
    & $cmakePath -B build -S .
    if ($LASTEXITCODE -ne 0) {
        throw "cmake configure failed with exit code $LASTEXITCODE"
    }

    & $cmakePath --build build --config Release
    if ($LASTEXITCODE -ne 0) {
        throw "cmake build failed with exit code $LASTEXITCODE"
    }
    $backendBuildResult = 'PASS'
} catch {
    $backendBuildResult = 'FAIL'
    $overallFailed = $true
    Write-Host "[FAIL] Backend build error: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

if ($backendBuildResult -eq 'PASS') {
    Write-Section "3. Running Backend CTest Suite"
    Push-Location $BackendDir
    try {
        & $ctestPath --test-dir build -C Release --output-on-failure
        if ($LASTEXITCODE -ne 0) {
            throw "ctest exited with code $LASTEXITCODE"
        }
        $backendCTestResult = 'PASS'
    } catch {
        $backendCTestResult = 'FAIL'
        $overallFailed = $true
        Write-Host "[FAIL] CTest error: $_" -ForegroundColor Red
    } finally {
        Pop-Location
    }
}

Write-Section "4. Verifying Frontend Dependencies & Production Build"
Push-Location $FrontendDir
try {
    $nodeModulesDir = Join-Path $FrontendDir 'node_modules'
    if ($InstallDependencies -or -not (Test-Path $nodeModulesDir)) {
        Write-Host "Running npm ci to install locked frontend dependencies..." -ForegroundColor Yellow
        & $npmCmd.Source ci
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed with exit code $LASTEXITCODE"
        }
    } else {
        Write-Host "[OK] frontend/node_modules already present (skipping npm ci; pass -InstallDependencies to force)."
    }

    & $npmCmd.Source run build
    if ($LASTEXITCODE -ne 0) {
        throw "npm run build failed with exit code $LASTEXITCODE"
    }
    $frontendBuildResult = 'PASS'
} catch {
    $frontendBuildResult = 'FAIL'
    $overallFailed = $true
    Write-Host "[FAIL] Frontend build error: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Section "Summary Report"
Write-Host ("  Backend Build (Release) : {0}" -f $backendBuildResult)  -ForegroundColor ($(if ($backendBuildResult  -eq 'PASS') { 'Green' } else { 'Red' }))
Write-Host ("  Backend CTest Suites    : {0}" -f $backendCTestResult)  -ForegroundColor ($(if ($backendCTestResult  -eq 'PASS') { 'Green' } elseif ($backendCTestResult -eq 'NOT RUN') { 'Yellow' } else { 'Red' }))
Write-Host ("  Frontend Build (Vite)   : {0}" -f $frontendBuildResult) -ForegroundColor ($(if ($frontendBuildResult -eq 'PASS') { 'Green' } else { 'Red' }))
Write-Host ""

if ($overallFailed) {
    exit 1
}
exit 0
