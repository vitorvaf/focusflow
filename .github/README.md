# Configuração do GitHub Copilot — FocusFlow

Este diretório contém toda a configuração necessária para que o GitHub Copilot trabalhe de forma otimizada no projeto FocusFlow.

## Estrutura dos Arquivos

```
FocusFlow/
├── AGENTS.md                                    # Instruções cross-agent (raiz)
└── .github/
    ├── copilot-instructions.md                  # Instruções globais do projeto
    ├── instructions/                            # Instruções por tipo de arquivo
    │   ├── csharp-backend.instructions.md       # Regras para C# (.cs)
    │   ├── typescript-frontend.instructions.md  # Regras para React/TS (.tsx/.ts)
    │   ├── testing.instructions.md              # Regras para testes
    │   └── electron-main.instructions.md        # Regras para Electron main process
    ├── agents/                                  # Agentes customizados
    │   ├── architect.agent.md                   # @architect — planeja features
    │   ├── implementer.agent.md                 # @implementer — executa planos
    │   ├── reviewer.agent.md                    # @reviewer — revisa código
    │   └── test-engineer.agent.md               # @test-engineer — escreve testes
    └── prompts/                                 # Prompts reutilizáveis (/comando)
        ├── new-endpoint.prompt.md               # /new-endpoint — scaffold de API
        ├── new-component.prompt.md              # /new-component — scaffold React
        ├── debug-obsidian-sync.prompt.md        # /debug-obsidian-sync — debug sync
        └── implement-feature.prompt.md          # /implement-feature — feature E2E
```

## Como Usar

### Instruções Automáticas
Os arquivos `copilot-instructions.md` e `*.instructions.md` são carregados **automaticamente** pelo Copilot. Não é necessário referenciá-los manualmente.

### Agentes (VS Code)
No chat do Copilot, use o seletor de agentes ou digite `@nome-do-agente`:
- `@architect` — Para planejar uma feature antes de implementar
- `@implementer` — Para executar um plano de implementação
- `@reviewer` — Para revisar código e encontrar problemas
- `@test-engineer` — Para gerar testes

### Prompts Reutilizáveis (VS Code)
No chat do Copilot, digite `/nome-do-prompt`:
- `/new-endpoint` — Cria um endpoint REST completo
- `/new-component` — Cria um componente React com types e testes
- `/debug-obsidian-sync` — Diagnostica e corrige o sync com Obsidian
- `/implement-feature` — Implementa uma feature end-to-end

## Configurações Recomendadas no VS Code

Adicione ao seu `settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.useInstructionFiles": true,
  "chat.useAgentsMdFile": true
}
```

## Dica

O `AGENTS.md` na raiz do projeto funciona como um fallback universal — qualquer agent de IA (Copilot, Claude, Cursor, etc.) o reconhece automaticamente.
