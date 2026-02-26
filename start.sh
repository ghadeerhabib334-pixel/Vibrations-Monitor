#!/bin/bash

echo "========================================"
echo "Vibration Sensor MCP Server"
echo "========================================"
echo ""
echo "Starting MCP server..."
echo "Dashboard: Open index.html in your browser"
echo "MCP WebSocket: ws://localhost:8765"
echo ""
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo ""

node mcp-server.js
