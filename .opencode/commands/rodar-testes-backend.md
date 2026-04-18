# Comando: rodar-testes-backend

Este comando invoca o agente `tester` para executar os testes unitários do backend (`xUnit`).

## Uso:
`/rodar-testes-backend`

O agente `tester` irá navegar até `tests/FocusFlow.Api.Tests` e executar `dotnet test`, reportando os resultados. Ele interpretará o output e informará se os testes passaram ou falharam.
