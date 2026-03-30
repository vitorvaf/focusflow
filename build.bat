@echo off
REM ============================================
REM FocusFlow — Build Completo
REM Gera instaladores .exe e .msi para Windows
REM ============================================

echo.
echo   FocusFlow Build Script
echo   ======================
echo.

REM Verificar se PowerShell esta disponivel
where powershell >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERRO: PowerShell nao encontrado.
    pause
    exit /b 1
)

REM Executar o script PowerShell
powershell -ExecutionPolicy Bypass -File "%~dp0build.ps1" %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo BUILD FALHOU! Verifique os erros acima.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
