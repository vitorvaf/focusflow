# Comando: revisar-alteracoes

Este comando invoca o agente `reviewer` para analisar um conjunto de alterações de código (ex: um diff, um arquivo modificado, ou um PR). O `reviewer` fornecerá feedback sem alterar o código.

## Uso:
`/revisar-alteracoes <contexto_das_alterações>`

**Exemplo:** `/revisar-alteracoes O arquivo src/FocusFlow.Api/Controllers/TaskItemController.cs foi modificado. Por favor, revise as alterações.`

O agente `reviewer` irá verificar a aderência às convenções (.NET, React/TypeScript, padrões de nomeação, XML docs), segurança, legibilidade e potencial de bugs, utilizando as instruções de `AGENTS.md` e `.github/copilot-instructions.md` como guia.
