# FocusFlow — Desenvolvimento no WSL

## O Problema

Você está desenvolvendo no WSL (Linux dentro do Windows). Na hora de gerar o instalador, existem três cenários possíveis:

| Cenário | Funciona? | Qualidade |
|---------|-----------|-----------|
| WSL gera `.deb` e roda no WSL via WSLg | Tecnicamente sim | Péssima — sem tray, sem notificações, visual quebrado |
| WSL gera `.exe` do Windows (cross-build) | Parcialmente | Instável — depende de Wine, `.msi` não funciona |
| **WSL compila .NET + Windows empacota Electron** | **Sim** | **Perfeita — instalador nativo Windows** |

## A Solução: Build Híbrido

O `build-wsl.sh` divide o trabalho entre os dois lados:

```
┌─────────────────────────────────────────────────┐
│                    WSL (Linux)                   │
│                                                   │
│  1. dotnet publish -r win-x64 --self-contained   │
│     └── Gera FocusFlow.Api.exe (cross-compile)   │
│                                                   │
│  O .NET suporta cross-compilation nativamente.    │
│  Roda no Linux, gera binário Windows. Sem gambis. │
└──────────────────────┬──────────────────────────┘
                       │ cmd.exe /c (ponte WSL→Windows)
┌──────────────────────▼──────────────────────────┐
│                 Windows (nativo)                  │
│                                                   │
│  2. npm ci + npm run build (Vite + TypeScript)   │
│  3. npx electron-builder --win nsis msi          │
│     └── Gera .exe e .msi nativos                 │
│                                                   │
│  Node.js e electron-builder rodam no Windows      │
│  real, garantindo instalador 100% funcional.      │
└──────────────────────────────────────────────────┘
```

## Pré-requisitos

### No WSL (Ubuntu)
```bash
# .NET 8 SDK
sudo apt-get update
sudo apt-get install -y dotnet-sdk-8.0

# Verificar
dotnet --version
```

### No Windows
```powershell
# Node.js 18+ (instalar NO WINDOWS, via instalador oficial)
# Download: https://nodejs.org
# Ou via winget:
winget install OpenJS.NodeJS.LTS

# Verificar (no PowerShell ou CMD)
node --version
npm --version
```

> **IMPORTANTE**: O Node.js precisa estar instalado **no Windows**, não no WSL.
> O electron-builder precisa rodar nativamente no Windows para gerar os instaladores corretamente.

## Como Usar

```bash
# Na primeira vez, dar permissão de execução
chmod +x build-wsl.sh

# Build completo — gera .exe + .msi
./build-wsl.sh

# Só .exe (NSIS — mais rápido)
./build-wsl.sh --target exe

# Só .msi (empresarial)
./build-wsl.sh --target msi

# Pular o backend (já compilado anteriormente)
./build-wsl.sh --skip-backend
```

## Onde o Projeto Deve Ficar?

### Recomendado: no filesystem do WSL
```
~/projects/FocusFlow/     →  \\wsl$\Ubuntu\home\user\projects\FocusFlow\
```
O script converte automaticamente os caminhos com `wslpath -w`.
O Windows acessa os arquivos do WSL via caminho UNC (`\\wsl$\...`).

### Também funciona: no filesystem do Windows
```
/mnt/c/Users/user/projects/FocusFlow/  →  C:\Users\user\projects\FocusFlow\
```
Ambos os lados acessam diretamente. Porém o I/O é mais lento quando
o WSL acessa `/mnt/c/` comparado ao filesystem nativo do WSL.

## Fluxo de Desenvolvimento Diário

```bash
# 1. Desenvolver no WSL (VS Code com Remote-WSL)
code .

# 2. Rodar backend .NET em dev
cd src/FocusFlow.Api && dotnet run

# 3. Rodar frontend em dev (em outro terminal)
# Usar Node.js do Windows para evitar problemas com Electron
cmd.exe /c "cd /d $(wslpath -w src/FocusFlow.Electron) && npm run dev"

# 4. Quando quiser gerar o instalador
./build-wsl.sh

# 5. O script abre o Explorer na pasta dos instaladores
#    Basta clicar no .exe para instalar!
```

## Qual Script Usar?

| Ambiente de desenvolvimento | Script de build | Resultado |
|-----------------------------|----------------|-----------|
| Windows nativo | `build.bat` / `build.ps1` | `.exe` + `.msi` |
| Linux nativo | `build.sh` | `.AppImage` + `.deb` |
| WSL → quer instalar no Windows | `build-wsl.sh` | `.exe` + `.msi` |
| WSL → quer rodar no Linux | `build.sh` | `.AppImage` + `.deb` |
| CI/CD (GitHub Actions) | Ver seção abaixo | Todos |

## Bonus: GitHub Actions para Build Multi-Plataforma

Se quiser automatizar builds para todas as plataformas, use GitHub Actions com matrix:

```yaml
# .github/workflows/build.yml
name: Build Installers

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - os: windows-latest
            target: "nsis msi"
            dotnet-runtime: win-x64
          - os: ubuntu-latest
            target: "AppImage deb"
            dotnet-runtime: linux-x64

    runs-on: ${{ matrix.os }}

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Publish .NET API
        run: |
          cd src/FocusFlow.Api
          dotnet publish -c Release -r ${{ matrix.dotnet-runtime }} \
            --self-contained true -p:PublishSingleFile=true \
            -p:EnableCompressionInSingleFile=true \
            -p:DebugType=none -o bin/publish

      - name: Build Frontend
        run: |
          cd src/FocusFlow.Electron
          npm ci
          npm run build

      - name: Package Installer
        run: |
          cd src/FocusFlow.Electron
          npx electron-builder --${{ matrix.os == 'windows-latest' && 'win' || 'linux' }} ${{ matrix.target }}

      - uses: actions/upload-artifact@v4
        with:
          name: installer-${{ matrix.os }}
          path: src/FocusFlow.Electron/dist/installers/*
```

Isso gera os instaladores automaticamente a cada tag de versão,
sem depender de nenhuma máquina local.

## Troubleshooting

### "Node.js não encontrado no Windows"
O Node.js precisa estar no PATH do Windows. Instale pelo instalador oficial do nodejs.org (não via WSL apt).

### "npm ci falha com EACCES"
Se o projeto está no filesystem do WSL (`~/...`), o Windows pode ter problemas de permissão. Duas soluções:
1. Mover o projeto para `/mnt/c/Users/.../FocusFlow/`
2. Ou rodar o terminal WSL como administrador

### "electron-builder não encontra o FocusFlow.Api.exe"
Verifique se o `dotnet publish` foi executado com `-r win-x64` (não `linux-x64`). O script `build-wsl.sh` já faz isso corretamente.

### "O app abre mas a API não inicia"
Se desenvolveu no WSL e rodou o app no Windows, o banco SQLite pode estar em caminho Linux. O `main.ts` usa `app.getPath('userData')` para resolver isso — o banco é criado no caminho correto do Windows.
