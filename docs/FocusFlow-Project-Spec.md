# FocusFlow — Pomodoro + Obsidian Kanban Manager

## Visão Geral do Projeto

Aplicativo desktop que combina gerenciamento de tarefas com a técnica Pomodoro, sincronizando automaticamente com o Obsidian via arquivos Markdown no formato do plugin Kanban. Usa SQLite como fonte de verdade para permitir recuperação em caso de perda do vault.

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
|--------|-----------|---------------|
| Frontend | Electron + React + TypeScript | Interface desktop nativa com acesso ao filesystem |
| Backend | .NET 8 Web API (C#) | API REST local servindo o Electron |
| Banco de Dados | SQLite via EF Core | Portável, sem servidor, backup fácil |
| Comunicação | HTTP REST (localhost) | Electron ↔ .NET via fetch |
| Notificações | Electron Notification API | Alertas nativos do Windows ao fim do Pomodoro |

---

## Arquitetura Geral

```
┌─────────────────────────────────────────────────────┐
│                   ELECTRON APP                       │
│  ┌───────────────────────────────────────────────┐  │
│  │           React + TypeScript (Renderer)        │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ Pomodoro  │ │  Task    │ │  Settings    │  │  │
│  │  │  Timer    │ │  Board   │ │  Panel       │  │  │
│  │  └──────────┘ └──────────┘ └──────────────┘  │  │
│  └──────────────────┬────────────────────────────┘  │
│                     │ HTTP (localhost:5111)           │
│  ┌──────────────────▼────────────────────────────┐  │
│  │          .NET 8 Web API (Backend)              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │  │
│  │  │ Tasks    │ │ Pomodoro │ │  Obsidian    │  │  │
│  │  │ Service  │ │ Service  │ │  Sync Service│  │  │
│  │  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │  │
│  │       │             │              │           │  │
│  │  ┌────▼─────────────▼──────┐ ┌─────▼───────┐  │  │
│  │  │    SQLite (EF Core)     │ │  Obsidian   │  │  │
│  │  │    focusflow.db         │ │  Vault (.md)│  │  │
│  │  └─────────────────────────┘ └─────────────┘  │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## Estrutura de Pastas do Projeto

```
FocusFlow/
├── FocusFlow.sln
│
├── src/
│   ├── FocusFlow.Api/                    # .NET 8 Web API
│   │   ├── Controllers/
│   │   │   ├── TasksController.cs        # CRUD de tarefas
│   │   │   ├── PomodoroController.cs     # Controle do timer
│   │   │   ├── BoardController.cs        # Operações do board
│   │   │   └── SettingsController.cs     # Configurações do app
│   │   ├── Services/
│   │   │   ├── TaskService.cs
│   │   │   ├── PomodoroService.cs
│   │   │   ├── ObsidianSyncService.cs    # Gera/atualiza .md no vault
│   │   │   └── BackupService.cs          # Restaura board a partir do SQLite
│   │   ├── Models/
│   │   │   ├── TaskItem.cs
│   │   │   ├── Board.cs
│   │   │   ├── PomodoroSession.cs
│   │   │   ├── Tag.cs
│   │   │   └── AppSettings.cs
│   │   ├── Data/
│   │   │   ├── AppDbContext.cs
│   │   │   └── Migrations/
│   │   ├── Hubs/
│   │   │   └── TimerHub.cs               # SignalR para tempo real
│   │   ├── Program.cs
│   │   └── appsettings.json
│   │
│   └── FocusFlow.Electron/              # Electron + React
│       ├── main/
│       │   ├── main.ts                   # Electron main process
│       │   ├── preload.ts                # Bridge para renderer
│       │   └── tray.ts                   # System tray com mini-timer
│       ├── renderer/
│       │   ├── src/
│       │   │   ├── App.tsx
│       │   │   ├── components/
│       │   │   │   ├── PomodoroTimer/
│       │   │   │   │   ├── PomodoroTimer.tsx
│       │   │   │   │   ├── TimerDisplay.tsx
│       │   │   │   │   └── TimerControls.tsx
│       │   │   │   ├── TaskBoard/
│       │   │   │   │   ├── KanbanBoard.tsx
│       │   │   │   │   ├── KanbanColumn.tsx
│       │   │   │   │   ├── TaskCard.tsx
│       │   │   │   │   └── TaskForm.tsx
│       │   │   │   ├── Settings/
│       │   │   │   │   └── SettingsPanel.tsx
│       │   │   │   └── Layout/
│       │   │   │       ├── Sidebar.tsx
│       │   │   │       └── Header.tsx
│       │   │   ├── hooks/
│       │   │   │   ├── usePomodoro.ts
│       │   │   │   ├── useTasks.ts
│       │   │   │   └── useSettings.ts
│       │   │   ├── services/
│       │   │   │   └── api.ts            # Fetch wrapper para .NET API
│       │   │   ├── types/
│       │   │   │   └── index.ts
│       │   │   └── styles/
│       │   │       └── global.css
│       │   ├── index.html
│       │   └── vite.config.ts
│       ├── package.json
│       └── electron-builder.yml
│
└── tests/
    ├── FocusFlow.Api.Tests/
    └── FocusFlow.Electron.Tests/
```

---

## Modelos de Dados (SQLite / EF Core)

### Diagrama ER

```
┌──────────────┐     ┌──────────────────┐     ┌────────────┐
│    Board     │     │    TaskItem       │     │    Tag     │
├──────────────┤     ├──────────────────┤     ├────────────┤
│ Id (PK)      │◄───┤ BoardId (FK)     │     │ Id (PK)   │
│ Name         │     │ Id (PK)          │     │ Name      │
│ VaultPath    │     │ Title            │     │ Color     │
│ CreatedAt    │     │ Description      │     └─────┬──────┘
│ UpdatedAt    │     │ Status (enum)    │           │
└──────────────┘     │ Priority (enum)  │     ┌─────┴──────┐
                     │ EstimatedPomos   │     │ TaskTag    │
                     │ CompletedPomos   │     │ (join)     │
                     │ DueDate          │     ├────────────┤
                     │ SortOrder        │     │ TaskId(FK) │
                     │ CreatedAt        │     │ TagId (FK) │
                     │ UpdatedAt        │     └────────────┘
                     │ CompletedAt      │
                     └───────┬──────────┘
                             │
                     ┌───────▼──────────┐
                     │ PomodoroSession  │
                     ├──────────────────┤
                     │ Id (PK)          │
                     │ TaskId (FK)      │
                     │ StartedAt        │
                     │ EndedAt          │
                     │ DurationMinutes  │
                     │ Type (enum)      │
                     │ Completed (bool) │
                     └──────────────────┘
```

### Entidades C\#

```csharp
// Models/TaskItem.cs
public class TaskItem
{
    public int Id { get; set; }
    public int BoardId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public TaskStatus Status { get; set; } = TaskStatus.Backlog;
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public int EstimatedPomodoros { get; set; } = 1;
    public int CompletedPomodoros { get; set; } = 0;
    public DateTime? DueDate { get; set; }
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }

    public Board Board { get; set; } = null!;
    public ICollection<PomodoroSession> Sessions { get; set; } = new List<PomodoroSession>();
    public ICollection<Tag> Tags { get; set; } = new List<Tag>();
}

public enum TaskStatus
{
    Backlog,     // Coluna: "Backlog"
    Todo,        // Coluna: "A Fazer"
    InProgress,  // Coluna: "Em Progresso"
    Done,        // Coluna: "Concluído"
    Archived     // Não aparece no board
}

public enum TaskPriority { Low, Medium, High, Urgent }

public enum PomodoroType { Focus, ShortBreak, LongBreak }
```

---

## API Endpoints (.NET)

### Tasks

```
GET    /api/tasks?boardId={id}&status={status}    # Listar tarefas (filtros opcionais)
GET    /api/tasks/{id}                              # Detalhes de uma tarefa
POST   /api/tasks                                   # Criar tarefa
PUT    /api/tasks/{id}                              # Atualizar tarefa
PATCH  /api/tasks/{id}/status                       # Mover tarefa de coluna
PATCH  /api/tasks/{id}/reorder                      # Reordenar dentro da coluna
DELETE /api/tasks/{id}                              # Deletar tarefa
```

### Pomodoro

```
POST   /api/pomodoro/start                          # Iniciar sessão { taskId, type }
POST   /api/pomodoro/pause                          # Pausar timer
POST   /api/pomodoro/resume                         # Retomar timer
POST   /api/pomodoro/stop                           # Parar/cancelar sessão
GET    /api/pomodoro/status                         # Estado atual do timer
GET    /api/pomodoro/history?taskId={id}&from={date}&to={date}  # Histórico
GET    /api/pomodoro/stats                          # Estatísticas (hoje, semana, total)
```

### Board & Sync

```
GET    /api/boards                                  # Listar boards
POST   /api/boards                                  # Criar board
PUT    /api/boards/{id}                             # Editar board
POST   /api/boards/{id}/sync                        # Forçar sync → Obsidian
POST   /api/boards/{id}/restore                     # Restaurar vault a partir do SQLite
```

### Settings

```
GET    /api/settings                                # Obter configurações
PUT    /api/settings                                # Salvar configurações
```

---

## Formato do Arquivo Kanban do Obsidian

O plugin Kanban do Obsidian usa um formato Markdown específico. O `ObsidianSyncService` deve gerar exatamente este formato:

### Exemplo de Output (.md)

```markdown
---
kanban-plugin: basic
---

## Backlog

- [ ] Estudar Docker #devops
- [ ] Ler capítulo 5 do livro #estudo

## A Fazer

- [ ] Configurar CI/CD do projeto #devops #urgente
- [ ] Revisar PR do Lucas #trabalho

## Em Progresso

- [ ] Refatorar módulo de auth #trabalho 🍅 3/5

## Concluído

- [x] Criar endpoint de login #trabalho ✅ 2025-03-28
- [x] Escrever testes unitários #trabalho ✅ 2025-03-27

%% kanban:settings
```json
{"kanban-plugin":"basic","list-collapse":[false,false,false,false]}
```
%%
```

### Regras de Geração do Markdown

1. O frontmatter DEVE conter `kanban-plugin: basic`
2. Cada coluna é um `## Heading`
3. Tarefas pendentes usam `- [ ]`, concluídas usam `- [x]`
4. Tags são inseridas como `#tag` no texto da tarefa
5. Pomodoros podem ser mostrados como `🍅 completados/estimados`
6. Data de conclusão como `✅ YYYY-MM-DD`
7. O bloco `kanban:settings` no final é obrigatório para o plugin reconhecer
8. A sincronização deve ser **atômica** (escrever em arquivo .tmp, depois renomear)

### Lógica do ObsidianSyncService

```csharp
// Services/ObsidianSyncService.cs — pseudocódigo
public class ObsidianSyncService
{
    // Chamado após qualquer mudança em TaskItem
    public async Task SyncBoardToVault(int boardId)
    {
        var board = await _db.Boards.Include(b => b.Tasks)
            .ThenInclude(t => t.Tags)
            .FirstAsync(b => b.Id == boardId);

        var markdown = GenerateKanbanMarkdown(board);

        var filePath = Path.Combine(board.VaultPath, $"{board.Name}.md");
        var tempPath = filePath + ".tmp";

        await File.WriteAllTextAsync(tempPath, markdown, Encoding.UTF8);
        File.Move(tempPath, filePath, overwrite: true); // Atomic
    }

    private string GenerateKanbanMarkdown(Board board)
    {
        var sb = new StringBuilder();
        sb.AppendLine("---");
        sb.AppendLine("kanban-plugin: basic");
        sb.AppendLine("---");
        sb.AppendLine();

        var columns = new[]
        {
            ("Backlog", TaskStatus.Backlog),
            ("A Fazer", TaskStatus.Todo),
            ("Em Progresso", TaskStatus.InProgress),
            ("Concluído", TaskStatus.Done)
        };

        foreach (var (name, status) in columns)
        {
            sb.AppendLine($"## {name}");
            sb.AppendLine();

            var tasks = board.Tasks
                .Where(t => t.Status == status)
                .OrderBy(t => t.SortOrder);

            foreach (var task in tasks)
            {
                var checkbox = status == TaskStatus.Done ? "[x]" : "[ ]";
                var tags = string.Join(" ", task.Tags.Select(t => $"#{t.Name}"));
                var pomos = task.EstimatedPomodoros > 0
                    ? $" 🍅 {task.CompletedPomodoros}/{task.EstimatedPomodoros}"
                    : "";
                var doneDate = task.CompletedAt.HasValue
                    ? $" ✅ {task.CompletedAt:yyyy-MM-dd}"
                    : "";

                sb.AppendLine($"- {checkbox} {task.Title} {tags}{pomos}{doneDate}".TrimEnd());
            }

            sb.AppendLine();
        }

        // Kanban settings block
        sb.AppendLine("%% kanban:settings");
        sb.AppendLine("```json");
        sb.AppendLine("{\"kanban-plugin\":\"basic\",\"list-collapse\":[false,false,false,false]}");
        sb.AppendLine("```");
        sb.AppendLine("%%");

        return sb.ToString();
    }
}
```

---

## Pomodoro Timer — Regras de Negócio

### Configurações Padrão (editáveis pelo usuário)

```json
{
  "focusDurationMinutes": 25,
  "shortBreakMinutes": 5,
  "longBreakMinutes": 15,
  "pomodorosUntilLongBreak": 4,
  "autoStartBreaks": true,
  "autoStartFocus": false,
  "dailyGoalPomodoros": 8,
  "notificationSound": true,
  "alwaysOnTop": false,
  "vaultBasePath": "C:\\Users\\{user}\\ObsidianVault"
}
```

### Fluxo do Timer

```
[IDLE] ──Start──► [FOCUS 25min] ──Complete──► [SHORT BREAK 5min] ──Complete──► [FOCUS]
                       │                              │
                       │ (a cada 4 focos)              │
                       │                              │
                       └──Complete──► [LONG BREAK 15min] ──Complete──► [FOCUS]
                       │
                  Cancel/Stop ──► [IDLE]
```

### Ao completar um Pomodoro de foco:
1. Incrementar `CompletedPomodoros` na tarefa
2. Salvar `PomodoroSession` no SQLite
3. Disparar sync com Obsidian
4. Enviar notificação nativa do Windows
5. Iniciar break automaticamente (se configurado)

---

## Interface do Usuário (Electron/React)

### Layout Principal

```
┌─────────────────────────────────────────────────────────────┐
│  FocusFlow                               ⚙️  ─  □  ×      │
├────────┬────────────────────────────────────────────────────┤
│        │                                                     │
│  📋   │   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌──────┐ │
│ Board  │   │ Backlog │  │ A Fazer │  │Em Progr.│  │ Done │ │
│        │   │         │  │         │  │         │  │      │ │
│  ⏱️   │   │ Task 1  │  │ Task 3  │  │ ►Task 5 │  │ ✓T7  │ │
│ Timer  │   │ Task 2  │  │ Task 4  │  │  Task 6 │  │ ✓T8  │ │
│        │   │         │  │         │  │  🍅 3/5 │  │      │ │
│  📊   │   │ + Nova  │  │ + Nova  │  │         │  │      │ │
│ Stats  │   └─────────┘  └─────────┘  └─────────┘  └──────┘ │
│        │                                                     │
│  ⚙️   │  ┌─────────────────────────────────────────────┐   │
│ Config │  │          🍅  18:42  ▶ ⏸ ⏹                  │   │
│        │  │  Tarefa atual: Refatorar módulo de auth      │   │
│        │  │  Pomodoro 3 de 5  ●●●○○                      │   │
│        │  └─────────────────────────────────────────────┘   │
└────────┴────────────────────────────────────────────────────┘
```

### System Tray (Mini Timer)

Quando minimizado, o app vai para o system tray mostrando:
- Ícone com progresso visual do timer
- Tooltip: "FocusFlow — 18:42 restantes"
- Menu: Play/Pause, Pular Break, Abrir App, Sair

### Funcionalidades de Drag & Drop

- Arrastar tarefas entre colunas muda o `Status`
- Arrastar dentro da coluna reordena (`SortOrder`)
- Toda mudança dispara sync com Obsidian

---

## Fluxo de Inicialização do App

```
1. Electron inicia (main.ts)
2. Spawn processo .NET API como child process
3. Aguarda .NET responder em localhost:5111/health
4. Abre janela do Renderer (React)
5. React carrega estado inicial via API
6. Se vault path configurado → verifica se existe
7. App pronto para uso
```

### Electron Main Process

```typescript
// main/main.ts — pseudocódigo
import { app, BrowserWindow, Tray } from 'electron';
import { spawn } from 'child_process';

let apiProcess: ChildProcess;

app.on('ready', async () => {
  // Inicia .NET API
  apiProcess = spawn('dotnet', ['run', '--project', '../FocusFlow.Api'], {
    env: { ...process.env, ASPNETCORE_URLS: 'http://localhost:5111' }
  });

  // Aguarda API ficar pronta
  await waitForApi('http://localhost:5111/health');

  // Cria janela
  const win = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });

  win.loadURL('http://localhost:5173'); // Vite dev ou build
});

app.on('will-quit', () => {
  apiProcess?.kill();
});
```

---

## SignalR Hub (Comunicação em Tempo Real)

Para o timer funcionar em tempo real entre backend e frontend:

```csharp
// Hubs/TimerHub.cs
public class TimerHub : Hub
{
    // Eventos enviados ao frontend:
    // "TimerTick"     → { remainingSeconds, totalSeconds, type }
    // "TimerComplete" → { type, taskId, completedPomodoros }
    // "TaskUpdated"   → { taskId, changes }
    // "BoardSynced"   → { boardId, timestamp }
}
```

---

## Comandos para Iniciar o Desenvolvimento

### 1. Criar Solution .NET

```bash
dotnet new sln -n FocusFlow
dotnet new webapi -n FocusFlow.Api -o src/FocusFlow.Api
dotnet sln add src/FocusFlow.Api

# Pacotes necessários
cd src/FocusFlow.Api
dotnet add package Microsoft.EntityFrameworkCore.Sqlite
dotnet add package Microsoft.EntityFrameworkCore.Design
dotnet add package Microsoft.AspNetCore.SignalR
```

### 2. Criar Projeto Electron

```bash
mkdir -p src/FocusFlow.Electron
cd src/FocusFlow.Electron
npm init -y
npm install electron electron-builder --save-dev
npm install react react-dom @types/react @types/react-dom typescript vite
npm install @microsoft/signalr
npm install @dnd-kit/core @dnd-kit/sortable  # Drag and drop
```

### 3. Criar Migration Inicial

```bash
cd src/FocusFlow.Api
dotnet ef migrations add InitialCreate
dotnet ef database update
```

---

## Checklist de Implementação (ordem sugerida)

### Fase 1 — Fundação
- [ ] Setup solution .NET + projeto Electron
- [ ] Modelar entidades e DbContext com EF Core + SQLite
- [ ] Criar migrations e seed de dados iniciais
- [ ] Implementar CRUD de Tasks (Controller + Service)
- [ ] Implementar CRUD de Boards
- [ ] Setup React com Vite no Electron renderer
- [ ] Criar componente KanbanBoard com drag & drop

### Fase 2 — Pomodoro Timer
- [ ] Implementar PomodoroService com lógica de estados
- [ ] Criar TimerHub (SignalR) para comunicação em tempo real
- [ ] Criar componente PomodoroTimer no React
- [ ] Integrar timer com tarefa selecionada
- [ ] Notificações nativas do Windows (Electron Notification API)
- [ ] System tray com mini-timer

### Fase 3 — Integração Obsidian
- [ ] Implementar ObsidianSyncService (gera Markdown Kanban)
- [ ] Auto-sync após qualquer mudança em tarefas
- [ ] Tela de Settings para configurar vault path
- [ ] Validação do vault path (verificar se existe)
- [ ] File watcher para detectar mudanças externas no .md (opcional)

### Fase 4 — Backup & Restore
- [ ] Endpoint de restore: regenerar .md a partir do SQLite
- [ ] Export/Import do banco SQLite
- [ ] Histórico e estatísticas de Pomodoros

### Fase 5 — Polish
- [ ] Temas claro/escuro
- [ ] Atalhos de teclado (Space = play/pause, etc.)
- [ ] Animações e transições
- [ ] Build de produção com electron-builder
- [ ] Auto-updater

---

## Instruções para o GitHub Copilot

> **Contexto**: Estou construindo o FocusFlow, um app desktop Electron + .NET 8 + SQLite
> que gerencia tarefas em um Kanban board com timer Pomodoro integrado.
> O app sincroniza o board com o Obsidian, gerando arquivos Markdown
> no formato do plugin Kanban do Obsidian.
>
> **Regras gerais**:
> - Backend: .NET 8 Web API, EF Core com SQLite, SignalR para tempo real
> - Frontend: Electron + React + TypeScript + Vite
> - Toda mudança em tarefa deve disparar sync com Obsidian (write .md)
> - SQLite é a fonte de verdade; o .md é derivado
> - O timer Pomodoro roda no backend (PomodoroService) e comunica via SignalR
> - Usar async/await em todo lugar
> - Nomes de variáveis e comentários em inglês, UI em português
>
> **Ao gerar código, sempre**:
> - Seguir a estrutura de pastas definida na spec
> - Usar os nomes de entidade, enum e endpoint exatos da spec
> - Implementar tratamento de erros
> - Incluir XML docs nos métodos públicos do C\#
> - Tipar tudo no TypeScript (sem `any`)
