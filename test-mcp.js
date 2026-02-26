#!/usr/bin/env node

/**
 * Test script for MCP server
 * This simulates how Claude Desktop would communicate with the server
 */

import { spawn } from 'child_process';
import { WebSocket } from 'ws';

console.log('🧪 Testing MCP Server\n');

// Test 1: Check if server starts
console.log('Test 1: Starting MCP server...');
const serverProcess = spawn('node', ['mcp-server.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let serverStarted = false;

serverProcess.stderr.on('data', (data) => {
  const output = data.toString();
  console.log('  Server:', output.trim());

  if (output.includes('MCP WebSocket server listening')) {
    serverStarted = true;
    console.log('  ✓ Server started successfully\n');

    // Give it a moment to fully initialize
    setTimeout(runTests, 1000);
  }
});

serverProcess.stdout.on('data', (data) => {
  console.log('  Server stdout:', data.toString().trim());
});

serverProcess.on('error', (error) => {
  console.error('  ✗ Server failed to start:', error.message);
  process.exit(1);
});

// Timeout if server doesn't start
setTimeout(() => {
  if (!serverStarted) {
    console.error('  ✗ Server failed to start within timeout');
    serverProcess.kill();
    process.exit(1);
  }
}, 5000);

function runTests() {
  console.log('Test 2: Connecting to WebSocket server...');

  const ws = new WebSocket('ws://localhost:8765');

  ws.on('open', () => {
    console.log('  ✓ WebSocket connected\n');

    console.log('Test 3: Testing MCP commands...');

    // Test getting dashboard status
    const testCommand = {
      type: 'getSensorData',
      requestId: 'test-' + Date.now()
    };

    console.log('  Sending command:', testCommand.type);
    ws.send(JSON.stringify(testCommand));

    // Wait for response or timeout
    setTimeout(() => {
      console.log('  ℹ Command sent (waiting for dashboard connection for actual response)\n');

      console.log('✅ All basic tests passed!\n');
      console.log('Summary:');
      console.log('  ✓ MCP server starts correctly');
      console.log('  ✓ WebSocket server accepts connections');
      console.log('  ✓ Can send commands to server');
      console.log('');
      console.log('Next steps:');
      console.log('  1. Open index.html in your browser');
      console.log('  2. Configure Claude Desktop with the MCP server');
      console.log('  3. Try commands like "Check dashboard status"');
      console.log('');

      ws.close();
      serverProcess.kill();
      process.exit(0);
    }, 2000);
  });

  ws.on('error', (error) => {
    console.error('  ✗ WebSocket connection failed:', error.message);
    serverProcess.kill();
    process.exit(1);
  });

  ws.on('message', (data) => {
    console.log('  ← Received:', data.toString());
  });
}
