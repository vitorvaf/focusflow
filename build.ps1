<#
.SYNOPSIS
    Script de build completo do FocusFlow.
    Compila o backend .NET, o frontend React e gera o instalador Windows.

.DESCRIPTION
    Etapas executadas:
    1. Publica o .NET API como executável standalone (self-contained, single-file)
    2. Compila o frontend React com Vite
    3. Compila o Electron main process (TypeScript → JavaScript)
    4. Empacota tudo com electron-builder gerando .exe e/ou .msi

.PARAMETER Target
    Tipo de instalador: "exe" (NSIS), "msi", ou "all" (ambos). Padrão: "all"

.PARAMETER SkipBackend
    Pula a compilação do backend (útil se já foi publicado)

.PARAMETER SkipFrontend
    Pula a compilação do frontend

.EXAMPLE
    .\build.ps1                    # Build completo, gera exe + msi
    .\build.ps1 -Target exe        # Gera apenas o instalador .exe
    .\build.ps1 -SkipBackend       # Rebuilda só o frontend e empacota
#>

param(
    [ValidateSet("exe", "msi", "all")]
    [string]$Target = "all",

    [switch]$SkipBackend,
    [switch]$SkipFrontend
)

# ============================================
# Configuração
# ============================================
$ErrorActionPreference = "Stop"

$RootDir = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$ApiDir = Join-Path $RootDir "src\FocusFlow.Api"
$ElectronDir = Join-Path $RootDir "src\FocusFlow.Electron"
$ApiPublishDir = Join-Path $ApiDir "bin\publish"
$InstallerOutputDir = Join-Path $ElectronDir "dist\installers"

$Runtime = "win-x64"
$Configuration = "Release"

# ============================================
# Funções auxiliares
# ============================================
function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
}

function Assert-Command {
    param([string]$Command, [string]$InstallHint)
    if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
        Write-Host "ERRO: '$Command' nao encontrado. $InstallHint" -ForegroundColor Red
        exit 1
    }
}

function Assert-ExitCode {
    param([string]$StepName)
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERRO: $StepName falhou com codigo $LASTEXITCODE" -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

# ============================================
# Verificar pré-requisitos
# ============================================
Write-Step "Verificando pre-requisitos"

Assert-Command "dotnet" "Instale o .NET 8 SDK: https://dotnet.microsoft.com/download"
Assert-Command "node" "Instale o Node.js 18+: https://nodejs.org"
Assert-Command "npm" "Instale o Node.js 18+: https://nodejs.org"

$dotnetVersion = dotnet --version
$nodeVersion = node --version
Write-Host "  .NET SDK:  $dotnetVersion"
Write-Host "  Node.js:   $nodeVersion"
Write-Host "  npm:       $(npm --version)"

# ============================================
# ETAPA 1: Publicar backend .NET
# ============================================
if (-not $SkipBackend) {
    Write-Step "Etapa 1/4 — Publicando backend .NET ($Runtime)"

    # Limpar publicação anterior
    if (Test-Path $ApiPublishDir) {
        Remove-Item -Recurse -Force $ApiPublishDir
    }

    Push-Location $ApiDir
    try {
        dotnet publish `
            -c $Configuration `
            -r $Runtime `
            --self-contained true `
            -p:PublishSingleFile=true `
            -p:IncludeNativeLibrariesForSelfExtract=true `
            -p:EnableCompressionInSingleFile=true `
            -p:DebugType=none `
            -p:DebugSymbols=false `
            -o $ApiPublishDir

        Assert-ExitCode "dotnet publish"

        # Verificar que o executável foi gerado
        $apiExe = Join-Path $ApiPublishDir "FocusFlow.Api.exe"
        if (-not (Test-Path $apiExe)) {
            Write-Host "ERRO: FocusFlow.Api.exe nao encontrado em $ApiPublishDir" -ForegroundColor Red
            exit 1
        }

        $exeSize = [math]::Round((Get-Item $apiExe).Length / 1MB, 1)
        Write-Host "  FocusFlow.Api.exe gerado ($exeSize MB)" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Step "Etapa 1/4 — Backend PULADO (--SkipBackend)"
}

# ============================================
# ETAPA 2: Compilar frontend React (Vite)
# ============================================
if (-not $SkipFrontend) {
    Write-Step "Etapa 2/4 — Compilando frontend React"

    Push-Location $ElectronDir
    try {
        # Instalar dependências se necessário
        if (-not (Test-Path "node_modules")) {
            Write-Host "  Instalando dependencias npm..."
            npm ci --silent
            Assert-ExitCode "npm ci"
        }

        # Build do renderer (React + Vite)
        npm run build:renderer
        Assert-ExitCode "Vite build"

        Write-Host "  Frontend compilado com sucesso" -ForegroundColor Green
    }
    finally {
        Pop-Location
    }
}
else {
    Write-Step "Etapa 2/4 — Frontend PULADO (--SkipFrontend)"
}

# ============================================
# ETAPA 3: Compilar Electron main process
# ============================================
Write-Step "Etapa 3/4 — Compilando Electron main process"

Push-Location $ElectronDir
try {
    npm run build:main
    Assert-ExitCode "Electron main build"

    Write-Host "  Main process compilado com sucesso" -ForegroundColor Green
}
finally {
    Pop-Location
}

# ============================================
# ETAPA 4: Empacotar com electron-builder
# ============================================
Write-Step "Etapa 4/4 — Gerando instalador(es) Windows"

Push-Location $ElectronDir
try {
    # Limpar instaladores anteriores
    if (Test-Path $InstallerOutputDir) {
        Remove-Item -Recurse -Force $InstallerOutputDir
    }

    switch ($Target) {
        "exe" {
            Write-Host "  Gerando instalador NSIS (.exe)..."
            npx electron-builder --win nsis --config electron-builder.yml
        }
        "msi" {
            Write-Host "  Gerando instalador MSI (.msi)..."
            npx electron-builder --win msi --config electron-builder.yml
        }
        "all" {
            Write-Host "  Gerando instaladores NSIS (.exe) e MSI (.msi)..."
            npx electron-builder --win nsis msi --config electron-builder.yml
        }
    }

    Assert-ExitCode "electron-builder"
}
finally {
    Pop-Location
}

# ============================================
# Resultado final
# ============================================
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "  BUILD CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""
Write-Host "  Instaladores gerados em:" -ForegroundColor White
Write-Host "  $InstallerOutputDir" -ForegroundColor Yellow
Write-Host ""

# Listar os arquivos gerados
Get-ChildItem -Path $InstallerOutputDir -File | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 1)
    Write-Host "    $($_.Name)  ($size MB)" -ForegroundColor White
}

Write-Host ""
