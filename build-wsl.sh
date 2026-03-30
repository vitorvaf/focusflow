#!/usr/bin/env bash
#
# FocusFlow — Build para Windows a partir do WSL
#
# Este script resolve o problema de cross-compilation:
# - Compila o backend .NET dentro do WSL (rápido, nativo)
# - Delega o empacotamento do Electron para o Windows (necessário para NSIS/MSI)
#
# Pré-requisitos:
#   WSL:     .NET 8 SDK instalado
#   Windows: Node.js 18+ instalado e acessível via cmd.exe
#
# Uso:
#   ./build-wsl.sh              # Build completo → .exe + .msi
#   ./build-wsl.sh --target exe # Só .exe (NSIS)
#   ./build-wsl.sh --target msi # Só .msi
#

set -euo pipefail

# ============================================
# Configuração
# ============================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$SCRIPT_DIR"
API_DIR="$ROOT_DIR/src/FocusFlow.Api"
ELECTRON_DIR="$ROOT_DIR/src/FocusFlow.Electron"
API_PUBLISH_DIR="$API_DIR/bin/publish"

TARGET="all"
SKIP_BACKEND=false

# ============================================
# Cores e helpers
# ============================================
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Executa um comando no Windows via PowerShell com PATH completo.
#
# Problema resolvido: o nvm-windows adiciona %NVM_HOME% e %NVM_SYMLINK%
# no PATH do usuário como texto literal. O PowerShell com
# [Environment]::GetEnvironmentVariable retorna esses tokens sem expandir.
# Esta função resolve os tokens manualmente e adiciona os caminhos do nvm.
#
# Uso: win_exec "npm ci" "$WIN_ELECTRON_DIR"
win_exec() {
    local cmd="$1"
    local dir="${2:-}"
    local ps_cmd

    # Montar PATH expandido: Machine + User + NVM paths
    ps_cmd='
        # Carregar PATH do registro (Machine + User)
        $machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
        $userPath    = [Environment]::GetEnvironmentVariable("Path", "User")
        $fullPath    = "$machinePath;$userPath"

        # Carregar variáveis do nvm-windows
        $nvmHome    = [Environment]::GetEnvironmentVariable("NVM_HOME", "User")
        $nvmSymlink = [Environment]::GetEnvironmentVariable("NVM_SYMLINK", "User")

        # Definir no ambiente atual para que %NVM_HOME% e %NVM_SYMLINK% resolvam
        if ($nvmHome)    { $env:NVM_HOME    = $nvmHome }
        if ($nvmSymlink) { $env:NVM_SYMLINK = $nvmSymlink }

        # Expandir tokens %VAR% no PATH (ex: %NVM_HOME% → C:\Users\...\nvm)
        $fullPath = [Environment]::ExpandEnvironmentVariables($fullPath)

        # Garantir que os caminhos do nvm estejam no PATH mesmo se não
        # apareceram como %tokens% (cobre instalações manuais)
        if ($nvmHome -and $fullPath -notlike "*$nvmHome*")       { $fullPath += ";$nvmHome" }
        if ($nvmSymlink -and $fullPath -notlike "*$nvmSymlink*") { $fullPath += ";$nvmSymlink" }

        $env:Path = $fullPath
    '

    if [[ -n "$dir" ]]; then
        ps_cmd="$ps_cmd; Set-Location '$dir'"
    fi
    ps_cmd="$ps_cmd; $cmd"

    powershell.exe -NoProfile -Command "$ps_cmd"
}

# ============================================
# Parse de argumentos
# ============================================
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target)      TARGET="$2"; shift 2 ;;
        --skip-backend) SKIP_BACKEND=true; shift ;;
        --help|-h)
            echo "Uso: ./build-wsl.sh [--target exe|msi|all] [--skip-backend]"
            exit 0
            ;;
        *) echo "Argumento desconhecido: $1"; exit 1 ;;
    esac
done

# ============================================
# Verificar que estamos no WSL
# ============================================
step "Verificando ambiente"

if ! grep -qi microsoft /proc/version 2>/dev/null; then
    echo -e "${YELLOW}AVISO: Não parece ser WSL. Este script é projetado para WSL.${NC}"
    echo "  Para Linux nativo, use: ./build.sh"
    echo "  Para Windows nativo, use: .\\build.bat"
    echo ""
    read -p "Continuar mesmo assim? (s/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 0
    fi
fi

# Verificar .NET no WSL
if ! command -v dotnet &> /dev/null; then
    echo -e "${RED}ERRO: .NET SDK não encontrado no WSL.${NC}"
    echo "  Instale: https://learn.microsoft.com/dotnet/core/install/linux-ubuntu"
    exit 1
fi

# Verificar Node.js no lado Windows (usando win_exec que resolve nvm)
WIN_NODE_VERSION=$(win_exec "node --version" 2>/dev/null | tr -d '\r' || true)

if [[ -z "$WIN_NODE_VERSION" ]]; then
    echo -e "${RED}ERRO: Node.js não encontrado no Windows.${NC}"
    echo "  Instale o Node.js 18+ NO WINDOWS (não no WSL): https://nodejs.org"
    echo ""
    echo "  IMPORTANTE: O Node.js precisa estar instalado no Windows,"
    echo "  não apenas no WSL, porque o electron-builder precisa"
    echo "  rodar nativamente no Windows para gerar o instalador."
    echo ""
    echo "  Se instalou via nvm-windows, verifique se ativou a versão:"
    echo "    nvm use <versão>"
    exit 1
fi

WIN_NPM_VERSION=$(win_exec "npm --version" 2>/dev/null | tr -d '\r' || true)

echo "  WSL .NET SDK:       $(dotnet --version)"
echo "  Windows Node.js:    $WIN_NODE_VERSION"
echo "  Windows npm:        $WIN_NPM_VERSION"
echo ""

# ============================================
# Converter caminho WSL → Windows
# ============================================
to_windows_path() {
    wslpath -w "$1"
}

WIN_ROOT_DIR="$(to_windows_path "$ROOT_DIR")"
WIN_ELECTRON_DIR="$(to_windows_path "$ELECTRON_DIR")"
WIN_API_PUBLISH_DIR="$(to_windows_path "$API_PUBLISH_DIR")"

echo -e "  Caminho WSL:     ${YELLOW}$ROOT_DIR${NC}"
echo -e "  Caminho Windows: ${YELLOW}$WIN_ROOT_DIR${NC}"

# ============================================
# ETAPA 1: Publicar backend .NET (no WSL — rápido!)
# ============================================
if [ "$SKIP_BACKEND" = false ]; then
    step "Etapa 1/3 — Publicando backend .NET (WSL → win-x64)"

    if [ -d "$API_PUBLISH_DIR" ]; then
        rm -rf "$API_PUBLISH_DIR"
    fi

    pushd "$API_DIR" > /dev/null

    # Cross-compile: roda no Linux, gera binário Windows
    dotnet publish \
        -c Release \
        -r win-x64 \
        --self-contained true \
        -p:PublishSingleFile=true \
        -p:IncludeNativeLibrariesForSelfExtract=true \
        -p:EnableCompressionInSingleFile=true \
        -p:DebugType=none \
        -p:DebugSymbols=false \
        -o "$API_PUBLISH_DIR"

    if [ ! -f "$API_PUBLISH_DIR/FocusFlow.Api.exe" ]; then
        echo -e "${RED}ERRO: FocusFlow.Api.exe não gerado${NC}"
        popd > /dev/null
        exit 1
    fi

    EXE_SIZE=$(du -h "$API_PUBLISH_DIR/FocusFlow.Api.exe" | cut -f1)
    echo -e "${GREEN}  FocusFlow.Api.exe gerado ($EXE_SIZE)${NC}"

    popd > /dev/null
else
    step "Etapa 1/3 — Backend PULADO (--skip-backend)"
fi

# ============================================
# ETAPA 2: Instalar dependências e compilar frontend (Windows)
# ============================================
step "Etapa 2/3 — Compilando frontend (via Windows Node.js)"

echo "  Instalando dependências npm..."
win_exec "npm ci --silent" "$WIN_ELECTRON_DIR"

echo "  Compilando renderer (Vite)..."
win_exec "npm run build:renderer" "$WIN_ELECTRON_DIR"

echo "  Compilando main process (TypeScript)..."
win_exec "npm run build:main" "$WIN_ELECTRON_DIR"

echo -e "${GREEN}  Frontend compilado com sucesso${NC}"

# ============================================
# ETAPA 3: Empacotar com electron-builder (Windows)
# ============================================
step "Etapa 3/3 — Gerando instalador Windows (via electron-builder)"

case "$TARGET" in
    exe)
        echo "  Gerando instalador NSIS (.exe)..."
        win_exec "npx electron-builder --win nsis --config electron-builder.yml" "$WIN_ELECTRON_DIR"
        ;;
    msi)
        echo "  Gerando instalador MSI (.msi)..."
        win_exec "npx electron-builder --win msi --config electron-builder.yml" "$WIN_ELECTRON_DIR"
        ;;
    all)
        echo "  Gerando instaladores NSIS (.exe) e MSI (.msi)..."
        win_exec "npx electron-builder --win nsis msi --config electron-builder.yml" "$WIN_ELECTRON_DIR"
        ;;
    *)
        echo -e "${RED}Target inválido: $TARGET${NC}"
        exit 1
        ;;
esac

# ============================================
# Resultado
# ============================================
INSTALLER_DIR="$ELECTRON_DIR/dist/installers"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  BUILD CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Instaladores gerados em:"
echo -e "  ${YELLOW}$INSTALLER_DIR${NC}"
echo ""

if [ -d "$INSTALLER_DIR" ]; then
    find "$INSTALLER_DIR" -maxdepth 1 -type f \( -name "*.exe" -o -name "*.msi" \) -exec sh -c '
        for f; do
            size=$(du -h "$f" | cut -f1)
            name=$(basename "$f")
            echo "    $name  ($size)"
        done
    ' _ {} +
fi

echo ""
echo "  Para instalar, navegue até a pasta acima no Windows Explorer"
echo "  ou execute diretamente:"
echo ""

WIN_INSTALLER_DIR="$(to_windows_path "$INSTALLER_DIR")"
echo -e "    explorer.exe \"${WIN_INSTALLER_DIR}\""
echo ""