#!/usr/bin/env node

/**
 * MCP Server for Vibration Sensor Monitoring Dashboard
 *
 * This server provides AI control and monitoring capabilities for the
 * Primatronic Erbessd Phantom vibration sensor dashboard.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WebSocketServer, WebSocket } from 'ws';

// WebSocket connection to the dashboard
let dashboardWS = null;
let wsServer = null;
const WS_PORT = 8765;

// State cache
let dashboardState = {
  connected: false,
  mqttConnected: false,
  sensorData: null,
  deviceInfo: null,
  logs: [],
  settings: null,
  lastUpdate: null
};

// Initialize WebSocket server to communicate with dashboard
function initWebSocketServer() {
  wsServer = new WebSocketServer({ port: WS_PORT });

  wsServer.on('connection', (ws) => {
    console.error('Dashboard connected to MCP server');
    dashboardWS = ws;
    dashboardState.connected = true;

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleDashboardMessage(data);
      } catch (e) {
        console.error('Failed to parse dashboard message:', e);
      }
    });

    ws.on('close', () => {
      console.error('Dashboard disconnected from MCP server');
      dashboardWS = null;
      dashboardState.connected = false;
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Request initial state
    sendToDashboard({ type: 'getState' });
  });

  console.error(`MCP WebSocket server listening on port ${WS_PORT}`);
}

// Handle messages from dashboard
function handleDashboardMessage(data) {
  dashboardState.lastUpdate = new Date().toISOString();

  switch (data.type) {
    case 'stateUpdate':
      dashboardState = { ...dashboardState, ...data.state };
      break;
    case 'sensorData':
      dashboardState.sensorData = data.data;
      break;
    case 'deviceInfo':
      dashboardState.deviceInfo = data.data;
      break;
    case 'log':
      dashboardState.logs.push({
        timestamp: new Date().toISOString(),
        ...data.log
      });
      // Keep only last 100 logs
      if (dashboardState.logs.length > 100) {
        dashboardState.logs = dashboardState.logs.slice(-100);
      }
      break;
    case 'settings':
      dashboardState.settings = data.settings;
      break;
    case 'mqttStatus':
      dashboardState.mqttConnected = data.connected;
      break;
  }
}

// Send command to dashboard
function sendToDashboard(command) {
  return new Promise((resolve, reject) => {
    if (!dashboardWS || dashboardWS.readyState !== WebSocket.OPEN) {
      reject(new Error('Dashboard not connected'));
      return;
    }

    const requestId = Date.now().toString();
    command.requestId = requestId;

    let responseReceived = false;

    // Set up response listener
    const responseHandler = (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.requestId === requestId) {
          responseReceived = true;
          if (dashboardWS) {
            dashboardWS.removeListener('message', responseHandler);
          }
          if (data.success) {
            resolve(data.result);
          } else {
            reject(new Error(data.error || 'Command failed'));
          }
        }
      } catch (e) {
        // Ignore parse errors for other messages
      }
    };

    dashboardWS.on('message', responseHandler);

    // Send command
    dashboardWS.send(JSON.stringify(command));

    // Timeout after 5 seconds
    setTimeout(() => {
      if (!responseReceived) {
        if (dashboardWS) {
          dashboardWS.removeListener('message', responseHandler);
        }
        reject(new Error('Command timeout'));
      }
    }, 5000);
  });
}

// MCP Server setup
const server = new Server(
  {
    name: 'vibration-sensor-monitor',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_dashboard_status',
        description: 'Get the current status of the dashboard including connection state and last update time',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_sensor_data',
        description: 'Get current sensor readings including vibration (X, Y, Z axes), temperature, battery, and signal strength',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_device_info',
        description: 'Get device information including friendly name, phantom code, gateway serial, and update interval',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_mqtt_settings',
        description: 'Get current MQTT broker settings including host, port, protocol, and subscribed topics',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_mqtt_settings',
        description: 'Update MQTT broker settings and reconnect',
        inputSchema: {
          type: 'object',
          properties: {
            host: {
              type: 'string',
              description: 'MQTT broker hostname',
            },
            port: {
              type: 'number',
              description: 'MQTT broker port (typically 8884 for WSS)',
            },
            protocol: {
              type: 'string',
              enum: ['ws', 'wss'],
              description: 'Protocol to use (ws or wss)',
            },
            username: {
              type: 'string',
              description: 'MQTT username (optional)',
            },
            password: {
              type: 'string',
              description: 'MQTT password (optional)',
            },
            topics: {
              type: 'array',
              items: { type: 'string' },
              description: 'Array of MQTT topics to subscribe to',
            },
          },
          required: ['host', 'port', 'protocol', 'topics'],
        },
      },
      {
        name: 'connect_mqtt',
        description: 'Connect to the MQTT broker using current settings',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'disconnect_mqtt',
        description: 'Disconnect from the MQTT broker',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_message_logs',
        description: 'Get recent MQTT message logs',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of log entries to return (default: 50)',
            },
          },
        },
      },
      {
        name: 'clear_message_logs',
        description: 'Clear the message log',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_vibration_history',
        description: 'Get historical vibration data for charts',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_temperature_history',
        description: 'Get historical temperature data for charts',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_alert_thresholds',
        description: 'Get ISO 10816 vibration severity thresholds',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'toggle_theme',
        description: 'Toggle between light and dark theme',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_dashboard_status':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                dashboardConnected: dashboardState.connected,
                mqttConnected: dashboardState.mqttConnected,
                lastUpdate: dashboardState.lastUpdate,
                status: dashboardState.connected ? 'online' : 'offline',
              }, null, 2),
            },
          ],
        };

      case 'get_sensor_data':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        const result = await sendToDashboard({ type: 'getSensorData' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };

      case 'get_device_info':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        const deviceInfo = await sendToDashboard({ type: 'getDeviceInfo' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(deviceInfo, null, 2),
            },
          ],
        };

      case 'get_mqtt_settings':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        const settings = await sendToDashboard({ type: 'getSettings' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(settings, null, 2),
            },
          ],
        };

      case 'update_mqtt_settings':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        await sendToDashboard({
          type: 'updateSettings',
          settings: args,
        });
        return {
          content: [
            {
              type: 'text',
              text: 'MQTT settings updated and reconnecting...',
            },
          ],
        };

      case 'connect_mqtt':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        await sendToDashboard({ type: 'connect' });
        return {
          content: [
            {
              type: 'text',
              text: 'Connecting to MQTT broker...',
            },
          ],
        };

      case 'disconnect_mqtt':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        await sendToDashboard({ type: 'disconnect' });
        return {
          content: [
            {
              type: 'text',
              text: 'Disconnected from MQTT broker',
            },
          ],
        };

      case 'get_message_logs':
        const limit = args.limit || 50;
        const logs = dashboardState.logs.slice(-limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(logs, null, 2),
            },
          ],
        };

      case 'clear_message_logs':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        await sendToDashboard({ type: 'clearLogs' });
        dashboardState.logs = [];
        return {
          content: [
            {
              type: 'text',
              text: 'Message logs cleared',
            },
          ],
        };

      case 'get_vibration_history':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        const vibHistory = await sendToDashboard({ type: 'getVibrationHistory' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(vibHistory, null, 2),
            },
          ],
        };

      case 'get_temperature_history':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        const tempHistory = await sendToDashboard({ type: 'getTemperatureHistory' });
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(tempHistory, null, 2),
            },
          ],
        };

      case 'get_alert_thresholds':
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                iso10816: {
                  good: { max: 1.1, description: 'Good condition' },
                  satisfactory: { min: 1.1, max: 2.8, description: 'Acceptable operation' },
                  unsatisfactory: { min: 2.8, max: 7.1, description: 'Remedial action recommended' },
                  danger: { min: 7.1, description: 'Machine damage imminent' },
                },
                battery: {
                  min: 2.0,
                  max: 3.6,
                  low_threshold: 2.4,
                },
                temperature: {
                  display_min: -10,
                  display_max: 80,
                },
              }, null, 2),
            },
          ],
        };

      case 'toggle_theme':
        if (!dashboardState.connected) {
          throw new Error('Dashboard not connected');
        }
        await sendToDashboard({ type: 'toggleTheme' });
        return {
          content: [
            {
              type: 'text',
              text: 'Theme toggled',
            },
          ],
        };

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// List resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'dashboard://status',
        name: 'Dashboard Status',
        description: 'Current status of the dashboard and MQTT connection',
        mimeType: 'application/json',
      },
      {
        uri: 'dashboard://sensor-data',
        name: 'Current Sensor Data',
        description: 'Real-time sensor readings from the vibration monitor',
        mimeType: 'application/json',
      },
      {
        uri: 'dashboard://logs',
        name: 'Message Logs',
        description: 'Recent MQTT message logs',
        mimeType: 'application/json',
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;

  switch (uri) {
    case 'dashboard://status':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({
              dashboardConnected: dashboardState.connected,
              mqttConnected: dashboardState.mqttConnected,
              lastUpdate: dashboardState.lastUpdate,
            }, null, 2),
          },
        ],
      };

    case 'dashboard://sensor-data':
      if (!dashboardState.connected) {
        throw new Error('Dashboard not connected');
      }
      try {
        const data = await sendToDashboard({ type: 'getSensorData' });
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: error.message }, null, 2),
            },
          ],
        };
      }

    case 'dashboard://logs':
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(dashboardState.logs, null, 2),
          },
        ],
      };

    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  // Log but don't crash on unhandled promise rejections
  // This can happen when dashboard disconnects during a pending command
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  // Only exit on critical errors
  if (error.code === 'EADDRINUSE') {
    console.error('Port 8765 is already in use. Please close the other instance.');
    process.exit(1);
  }
});

// Start the server
async function main() {
  // Initialize WebSocket server first
  initWebSocketServer();

  // Start MCP server on stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Vibration Sensor MCP Server running');
  console.error('Dashboard should connect to ws://localhost:' + WS_PORT);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
