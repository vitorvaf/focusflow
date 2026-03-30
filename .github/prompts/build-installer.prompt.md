---
agent: 'agent'
description: 'Configurar e executar o build de produção do FocusFlow — gera instalador .exe/.msi'
tools: ['search/codebase', 'readfile', 'editfiles', 'terminal']
---

# Build de Produção do FocusFlow

Configure o pipeline de build para gerar um instalador Windows (.exe e/ou .msi).

**Tipo de instalador**: ${input:target:exe, msi, ou all (ambos)}

## Pré-requisitos

Verifique que estão disponíveis no terminal:
- `dotnet --version` (precisa .NET 8+)
- `node --version` (precisa 18+)
- `npm --version`

## Pipeline de Build

### 1. Publicar backend .NET
```bash
cd src/FocusFlow.Api
dotnet publish -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -p:IncludeNativeLibrariesForSelfExtract=true -p:EnableCompressionInSingleFile=true -p:DebugType=none -o bin/publish
```
Confirme que `bin/publish/FocusFlow.Api.exe` existe.

### 2. Compilar frontend
```bash
cd src/FocusFlow.Electron
npm ci
npm run build:renderer
npm run build:main
```

### 3. Verificar electron-builder.yml
- `extraResources` aponta para `../FocusFlow.Api/bin/publish/` → `api`
- `win.target` inclui o tipo solicitado: ${input:target}
- `files` inclui `dist/**/*` e `main/**/*.js`

### 4. Verificar main.ts
- Em produção (`app.isPackaged === true`), a API é carregada de:
  `path.join(process.resourcesPath, 'api', 'FocusFlow.Api.exe')`
- Em desenvolvimento, usa `dotnet run`

### 5. Gerar instalador
```bash
cd src/FocusFlow.Electron
npx electron-builder --win ${input:target} --config electron-builder.yml
```

### 6. Testar
- Navegue até `src/FocusFlow.Electron/dist/installers/`
- Liste os arquivos gerados com seus tamanhos
- Relate o resultado

## Troubleshooting
- Se `electron-builder` falhar com "cannot find module", rode `npm ci` novamente
- Se o .exe da API não for encontrado, verifique o caminho em `extraResources`
- Se o instalador abrir mas a API não subir, verifique o `getApiConfig()` em main.ts
