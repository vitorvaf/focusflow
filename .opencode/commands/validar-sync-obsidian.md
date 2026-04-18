# Comando: validar-sync-obsidian

Este comando invoca o agente `debugger` para investigar e validar o mecanismo de sincronização com o Obsidian, que é crítico para o projeto.

## Uso:
`/validar-sync-obsidian <id_do_board_ou_contexto>`

**Exemplo:** `/validar-sync-obsidian boardId=123`

O agente `debugger` irá analisar o `ObsidianSyncService`, verificar a existência e o conteúdo dos arquivos Markdown gerados e quaisquer logs relacionados à sincronização. Ele pode simular cenários (se instruído) ou investigar um problema específico na sincronização, sempre com foco em diagnosticar e não em alterar o código diretamente.
