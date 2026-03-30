# FocusFlow — Build e Empacotamento

## Visão Geral

O build gera um instalador Windows (.exe ou .msi) que contém:
- O frontend Electron + React (compilado)
- O backend .NET API como executável standalone (não requer .NET instalado)
- O banco SQLite é criado automaticamente na primeira execução

O usuário final instala o app como qualquer programa Windows.

---

## Pré-requisitos (só para desenvolvimento)

| Ferramenta | Versão Mínima | Para quê |
|-----------|--------------|----------|
| .NET SDK | 8.0 | Compilar e publicar o backend |
| Node.js | 18+ | Compilar o frontend e empacotar |
| npm | 9+ | Gerenciar dependências JS |

> O usuário final **não precisa** de nenhum desses. O instalador é completamente standalone.

---

## Como Gerar o Instalador

### Opção 1: Script automatizado (recomendado)

```powershell
# Build completo — gera .exe + .msi
.\build.bat

# Ou via PowerShell diretamente:
.\build.ps1                     # Gera .exe + .msi
.\build.ps1 -Target exe         # Só .exe (NSIS)
.\build.ps1 -Target msi         # Só .msi
.\build.ps1 -SkipBackend        # Pula o backend (já compilado)
```

### Opção 2: Comandos npm

```bash
cd src/FocusFlow.Electron

# Primeiro, publicar o backend manualmente:
cd ../FocusFlow.Api
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o bin/publish

# Depois, gerar o instalador:
cd ../FocusFlow.Electron
npm run pack:exe    # Gera .exe
npm run pack:msi    # Gera .msi
npm run pack:all    # Gera ambos
```

### Opção 3: Copilot CLI

```
/build-installer
```

---

## Onde Ficam os Instaladores

```
src/FocusFlow.Electron/dist/installers/
├── FocusFlow Setup 1.0.0.exe     # Instalador NSIS (~80-120 MB)
├── FocusFlow 1.0.0.msi           # Instalador MSI (~80-120 MB)
└── latest.yml                    # Metadados para auto-update
```

---

## Como o App Funciona em Produção

```
C:\Users\{user}\AppData\Local\Programs\FocusFlow\
├── FocusFlow.exe                  # Electron (processo principal)
├── resources/
│   ├── app/                       # Frontend React compilado
│   │   ├── dist/                  # HTML/JS/CSS do Vite
│   │   └── main/                  # Electron main process (JS)
│   └── api/                       # Backend .NET standalone
│       ├── FocusFlow.Api.exe      # API self-contained
│       └── focusflow.db           # SQLite (criado na 1ª execução)
└── ...                            # DLLs do Electron/Chromium
```

### Fluxo de inicialização:

```
Usuário abre FocusFlow.exe
  → Electron (main.ts) detecta que app.isPackaged === true
  → Spawna resources/api/FocusFlow.Api.exe
  → Aguarda health check em localhost:5111
  → Abre a janela React
  → App pronto!
```

---

## Configuração dos Ícones

Coloque os ícones na pasta `src/FocusFlow.Electron/build/`:

```
build/
├── icon.ico          # Windows (256x256, multi-resolução)
├── icon.png          # Fallback e tray (512x512)
└── icon.icns         # macOS (se quiser suportar)
```

Gerador de ícones: https://www.electron.build/icons

---

## Diferenças Dev vs Produção

| Aspecto | Desenvolvimento | Produção |
|---------|----------------|----------|
| API .NET | `dotnet run` no projeto | `FocusFlow.Api.exe` standalone |
| Frontend | Vite dev server (:5173) | Arquivos estáticos em `dist/` |
| DevTools | Aberto automaticamente | Desabilitado |
| Caminho da API | Projeto fonte | `process.resourcesPath/api/` |
| SQLite | `src/FocusFlow.Api/` | `resources/api/` |
| Hot reload | Sim (Vite HMR) | Não |

---

## Troubleshooting

### O instalador é gerado mas o app não abre
- Verifique se `extraResources` no `electron-builder.yml` está apontando para o diretório correto do publish
- O `FocusFlow.Api.exe` precisa existir em `src/FocusFlow.Api/bin/publish/`

### O app abre mas mostra tela branca
- O Vite build pode não ter sido executado. Rode `npm run build:renderer`
- Em produção, o `main.ts` carrega `dist/index.html` — confirme que o arquivo existe

### O app abre mas as tarefas não carregam
- A API pode não ter iniciado. Verifique se a porta 5111 não está em uso
- Olhe o console do Electron (Menu > View > Toggle Developer Tools) para erros

### O MSI pede permissão de administrador
- Normal: MSI instala `perMachine: true` por padrão. Mude para `false` no `electron-builder.yml` se preferir instalar por usuário
