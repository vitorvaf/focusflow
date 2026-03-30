# FocusFlow — Build Cross-Platform

## Comandos Rápidos

### Windows
```powershell
.\build.bat                        # .exe + .msi (NSIS + MSI)
.\build.ps1 -Target exe            # Só .exe
.\build.ps1 -Target msi            # Só .msi
```

### Linux
```bash
chmod +x build.sh                  # Só na primeira vez
./build.sh                         # AppImage + .deb
./build.sh --target appimage       # Só AppImage
./build.sh --target deb            # Só .deb
```

## Mapa de Formatos por Plataforma

| Plataforma | Formato | Vantagem | Comando |
|-----------|---------|----------|---------|
| Windows | `.exe` (NSIS) | Familiar ao usuário, instalação visual | `--target exe` |
| Windows | `.msi` | Corporativo, deploy via GPO | `--target msi` |
| Linux | `.AppImage` | Universal, roda em qualquer distro | `--target appimage` |
| Linux | `.deb` | Nativo Debian/Ubuntu, integra com apt | `--target deb` |

## Caminhos por SO

| O quê | Windows | Linux |
|-------|---------|-------|
| Binário API | `FocusFlow.Api.exe` | `FocusFlow.Api` |
| Runtime .NET | `win-x64` | `linux-x64` / `linux-arm64` |
| Dados do app | `%AppData%\FocusFlow\` | `~/.config/FocusFlow/` |
| Ícone | `icon.ico` | `icon.png` (múltiplas resoluções) |
| Instalador | `dist/installers/*.exe` | `dist/installers/*.AppImage` |

## Ícones para Linux

O electron-builder espera uma pasta `build/icons/` com PNGs em múltiplas resoluções:

```
build/icons/
├── 16x16.png
├── 32x32.png
├── 48x48.png
├── 64x64.png
├── 128x128.png
├── 256x256.png
└── 512x512.png
```

Dica: gere a partir de um PNG 512x512 com ImageMagick:
```bash
for size in 16 32 48 64 128 256 512; do
  convert icon-512.png -resize ${size}x${size} build/icons/${size}x${size}.png
done
```

## O Que Mudou no main.ts (Cross-Platform)

O `main.ts` agora detecta a plataforma automaticamente:

- `process.platform` → escolhe o nome do binário (com/sem `.exe`)
- `app.getPath('userData')` → caminho de dados correto por SO
- No Linux, faz `chmod +x` no binário da API na primeira execução
- Mensagens de erro adaptadas (ex: dica de permissão no Linux)
- Ícone selecionado por SO: `.ico` (Win), `.png` (Linux), `.icns` (Mac)
