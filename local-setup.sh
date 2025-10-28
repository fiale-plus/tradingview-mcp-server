#!/bin/bash
set -e

# TradingView MCP Server - Local Project Setup
# This script sets up project-level MCP configuration for Claude Code

echo "🚀 TradingView MCP Server - Local Setup"
echo "========================================"
echo ""

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get timestamp for backups
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Check if .mcp.json exists and backup
if [ -f ".mcp.json" ]; then
    BACKUP_FILE=".mcp.json.backup-${TIMESTAMP}"
    cp ".mcp.json" "$BACKUP_FILE"
    echo -e "${YELLOW}⚠️  Existing .mcp.json found - backed up to: ${BACKUP_FILE}${NC}"
fi

# Check if .claude/settings.local.json exists and backup
if [ -f ".claude/settings.local.json" ]; then
    BACKUP_FILE=".claude/settings.local.json.backup-${TIMESTAMP}"
    cp ".claude/settings.local.json" "$BACKUP_FILE"
    echo -e "${YELLOW}⚠️  Existing settings.local.json found - backed up to: ${BACKUP_FILE}${NC}"
fi

echo ""

# Copy example files to actual locations
echo "📋 Copying configuration files..."

# Ensure .claude directory exists
mkdir -p .claude

# Copy MCP config
if [ -f ".mcp.json.example" ]; then
    cp ".mcp.json.example" ".mcp.json"
    echo -e "${GREEN}✅ Created .mcp.json from example${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: .mcp.json.example not found${NC}"
fi

# Copy Claude settings
if [ -f ".claude/settings.json.example" ]; then
    cp ".claude/settings.json.example" ".claude/settings.local.json"
    echo -e "${GREEN}✅ Created .claude/settings.local.json from example${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: .claude/settings.json.example not found${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}✨ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo ""
echo "  1. ${BLUE}Restart Claude Code${NC} to load the MCP server"
echo ""
echo "  2. Try the demo commands:"
echo "     ${BLUE}/market-regime${NC}  - Check market health"
echo "     ${BLUE}/run-screener${NC}   - Run stock screener"
echo ""
echo "💡 Tips:"
echo ""
echo "  • MCP config uses published npm package: npx tradingview-mcp-server"
echo "  • For development, edit .mcp.json and change args to: [\"tsx\", \"src/index.ts\"]"
echo "  • Both config files are gitignored - safe to customize"
echo ""
echo "📚 Documentation: README.md and docs/development.md"
echo ""
