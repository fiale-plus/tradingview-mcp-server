@echo off
REM TradingView MCP Server - Local Project Setup (Windows)
REM This script sets up project-level MCP configuration for Claude Code

echo.
echo ========================================
echo TradingView MCP Server - Local Setup
echo ========================================
echo.

REM Get timestamp for backups
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Check if .mcp.json exists and backup
if exist .mcp.json (
    set BACKUP_FILE=.mcp.json.backup-%TIMESTAMP%
    copy .mcp.json "!BACKUP_FILE!" >nul
    echo [Warning] Existing .mcp.json found - backed up to: !BACKUP_FILE!
)

REM Check if .claude\settings.local.json exists and backup
if exist .claude\settings.local.json (
    set BACKUP_FILE=.claude\settings.local.json.backup-%TIMESTAMP%
    copy .claude\settings.local.json "!BACKUP_FILE!" >nul
    echo [Warning] Existing settings.local.json found - backed up to: !BACKUP_FILE!
)

echo.
echo Copying configuration files...

REM Ensure .claude directory exists
if not exist .claude mkdir .claude

REM Copy MCP config
if exist .mcp.json.example (
    copy .mcp.json.example .mcp.json >nul
    echo [OK] Created .mcp.json from example
) else (
    echo [Warning] .mcp.json.example not found
)

REM Copy Claude settings
if exist .claude\settings.json.example (
    copy .claude\settings.json.example .claude\settings.local.json >nul
    echo [OK] Created .claude\settings.local.json from example
) else (
    echo [Warning] .claude\settings.json.example not found
)

echo.
echo ========================================
echo Setup complete!
echo ========================================
echo.
echo Next steps:
echo.
echo   1. Restart Claude Code to load the MCP server
echo.
echo   2. Try the demo commands:
echo      /market-regime  - Check market health
echo      /run-screener   - Run stock screener
echo.
echo Tips:
echo.
echo   * MCP config uses published npm package: npx tradingview-mcp-server
echo   * For development, edit .mcp.json and change args to: ["tsx", "src/index.ts"]
echo   * Both config files are gitignored - safe to customize
echo.
echo Documentation: README.md and docs\development.md
echo.
pause
