# Comando: analisar-arquitetura

Este comando invoca o agente `planner` para realizar uma análise detalhada da arquitetura do projeto ou de um componente específico.

## Uso:
`/analisar-arquitetura <componente_ou_área>`

**Exemplo:** `/analisar-arquitetura src/FocusFlow.Api/Services/ObsidianSyncService.cs`

O agente `planner` irá ler os arquivos relevantes e fornecerá uma visão geral, explicando como o componente funciona, suas dependências e sua relação com o restante do sistema, aderindo às convenções de arquitetura descritas nos documentos `AGENTS.md` e `.github/copilot-instructions.md`.
