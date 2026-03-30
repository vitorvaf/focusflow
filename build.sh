#!/usr/bin/env bash
#
# FocusFlow — Build Completo (Linux)
# Compila o backend .NET, o frontend React e gera o instalador Linux.
#
# Uso:
#   ./build.sh                    # Build completo, gera AppImage + deb
#   ./build.sh --target appimage  # Gera apenas AppImage
#   ./build.sh --target deb       # Gera apenas .deb
#   ./build.sh --skip-backend     # Pula compilação do backend
#   ./build.sh --skip-frontend    # Pula compilação do frontend
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
INSTALLER_OUTPUT_DIR="$ELECTRON_DIR/dist/installers"

CONFIGURATION="Release"

# Detectar runtime .NET baseado na arquitetura
ARCH="$(uname -m)"
case "$ARCH" in
    x86_64)  RUNTIME="linux-x64" ;;
    aarch64) RUNTIME="linux-arm64" ;;
    armv7l)  RUNTIME="linux-arm" ;;
    *)
        echo "ERRO: Arquitetura não suportada: $ARCH"
        exit 1
        ;;
esac

# Argumentos padrão
TARGET="all"
SKIP_BACKEND=false
SKIP_FRONTEND=false

# ============================================
# Parse de argumentos
# ============================================
while [[ $# -gt 0 ]]; do
    case "$1" in
        --target)
            TARGET="$2"
            shift 2
            ;;
        --skip-backend)
            SKIP_BACKEND=true
            shift
            ;;
        --skip-frontend)
            SKIP_FRONTEND=true
            shift
            ;;
        --help|-h)
            echo "Uso: ./build.sh [--target appimage|deb|all] [--skip-backend] [--skip-frontend]"
            exit 0
            ;;
        *)
            echo "Argumento desconhecido: $1"
            echo "Use --help para ver as opções."
            exit 1
            ;;
    esac
done

# ============================================
# Funções auxiliares
# ============================================
CYAN='\033[0;36m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

step() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

check_command() {
    local cmd="$1"
    local hint="$2"
    if ! command -v "$cmd" &> /dev/null; then
        echo -e "${RED}ERRO: '$cmd' não encontrado. $hint${NC}"
        exit 1
    fi
}

# ============================================
# Verificar pré-requisitos
# ============================================
step "Verificando pré-requisitos"

check_command "dotnet" "Instale o .NET 8 SDK: https://dotnet.microsoft.com/download"
check_command "node"   "Instale o Node.js 18+: https://nodejs.org"
check_command "npm"    "Instale o Node.js 18+: https://nodejs.org"

echo "  .NET SDK:      $(dotnet --version)"
echo "  Node.js:       $(node --version)"
echo "  npm:           $(npm --version)"
echo "  Arquitetura:   $ARCH → $RUNTIME"

# ============================================
# ETAPA 1: Publicar backend .NET
# ============================================
if [ "$SKIP_BACKEND" = false ]; then
    step "Etapa 1/4 — Publicando backend .NET ($RUNTIME)"

    # Limpar publicação anterior
    if [ -d "$API_PUBLISH_DIR" ]; then
        rm -rf "$API_PUBLISH_DIR"
    fi

    pushd "$API_DIR" > /dev/null

    dotnet publish \
        -c "$CONFIGURATION" \
        -r "$RUNTIME" \
        --self-contained true \
        -p:PublishSingleFile=true \
        -p:IncludeNativeLibrariesForSelfExtract=true \
        -p:EnableCompressionInSingleFile=true \
        -p:DebugType=none \
        -p:DebugSymbols=false \
        -o "$API_PUBLISH_DIR"

    # Verificar que o executável foi gerado
    API_EXE="$API_PUBLISH_DIR/FocusFlow.Api"
    if [ ! -f "$API_EXE" ]; then
        echo -e "${RED}ERRO: FocusFlow.Api não encontrado em $API_PUBLISH_DIR${NC}"
        popd > /dev/null
        exit 1
    fi

    # Garantir que é executável
    chmod +x "$API_EXE"

    EXE_SIZE=$(du -h "$API_EXE" | cut -f1)
    echo -e "${GREEN}  FocusFlow.Api gerado ($EXE_SIZE)${NC}"

    popd > /dev/null
else
    step "Etapa 1/4 — Backend PULADO (--skip-backend)"
fi

# ============================================
# ETAPA 2: Compilar frontend React (Vite)
# ============================================
if [ "$SKIP_FRONTEND" = false ]; then
    step "Etapa 2/4 — Compilando frontend React"

    pushd "$ELECTRON_DIR" > /dev/null

    # Instalar dependências se necessário
    if [ ! -d "node_modules" ]; then
        echo "  Instalando dependências npm..."
        npm ci --silent
    fi

    # Build do renderer (React + Vite)
    npm run build:renderer

    echo -e "${GREEN}  Frontend compilado com sucesso${NC}"

    popd > /dev/null
else
    step "Etapa 2/4 — Frontend PULADO (--skip-frontend)"
fi

# ============================================
# ETAPA 3: Compilar Electron main process
# ============================================
step "Etapa 3/4 — Compilando Electron main process"

pushd "$ELECTRON_DIR" > /dev/null
npm run build:main
echo -e "${GREEN}  Main process compilado com sucesso${NC}"
popd > /dev/null

# ============================================
# ETAPA 4: Empacotar com electron-builder
# ============================================
step "Etapa 4/4 — Gerando instalador(es) Linux"

pushd "$ELECTRON_DIR" > /dev/null

# Limpar instaladores anteriores
if [ -d "$INSTALLER_OUTPUT_DIR" ]; then
    rm -rf "$INSTALLER_OUTPUT_DIR"
fi

case "$TARGET" in
    appimage)
        echo "  Gerando AppImage..."
        npx electron-builder --linux AppImage --config electron-builder.yml
        ;;
    deb)
        echo "  Gerando pacote .deb..."
        npx electron-builder --linux deb --config electron-builder.yml
        ;;
    all)
        echo "  Gerando AppImage + .deb..."
        npx electron-builder --linux AppImage deb --config electron-builder.yml
        ;;
    *)
        echo -e "${RED}Target inválido: $TARGET. Use: appimage, deb, ou all${NC}"
        popd > /dev/null
        exit 1
        ;;
esac

popd > /dev/null

# ============================================
# Resultado final
# ============================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  BUILD CONCLUÍDO COM SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "  Instaladores gerados em:"
echo -e "  ${YELLOW}$INSTALLER_OUTPUT_DIR${NC}"
echo ""

# Listar os arquivos gerados
if [ -d "$INSTALLER_OUTPUT_DIR" ]; then
    find "$INSTALLER_OUTPUT_DIR" -maxdepth 1 -type f -exec sh -c '
        for f; do
            size=$(du -h "$f" | cut -f1)
            name=$(basename "$f")
            echo "    $name  ($size)"
        done
    ' _ {} +
fi

echo ""
