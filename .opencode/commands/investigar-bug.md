# Comando: investigar-bug

Este comando invoca o agente `debugger` para investigar um bug específico.

## Uso:
`/investigar-bug <descrição_do_bug_e_passos_para_reproduzir>`

**Exemplo:** `/investigar-bug O timer Pomodoro não pausa corretamente após um Short Break. O problema parece estar em src/FocusFlow.Api/Services/PomodoroService.cs.`

O agente `debugger` irá analisar o problema, ler arquivos relevantes, procurar logs e tentar identificar a causa raiz, fornecendo um diagnóstico detalhado. Ele não implementará a correção, mas fornecerá informações para que o `implementer` possa agir.
