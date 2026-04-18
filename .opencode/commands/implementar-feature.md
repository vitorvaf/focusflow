# Comando: implementar-feature

Este comando invoca o agente `implementer` para adicionar uma nova funcionalidade ou realizar uma alteração significativa no código, seguindo um plano.

## Uso:
`/implementar-feature <descrição_da_feature_ou_link_para_plano>`

**Exemplo:** `/implementar-feature Adicionar filtro de tags no frontend para a board kanban.`

O agente `implementer` irá focar na execução do código, garantindo que as alterações sigam as convenções do projeto, incluindo async/await, tipagem estrita e o gatilho de sincronização do Obsidian para mutações de `TaskItem`. Ele também procurará ou sugerirá a criação de testes e rodará o build e/ou testes após a implementação.
