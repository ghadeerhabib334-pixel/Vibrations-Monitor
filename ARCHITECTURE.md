# System Architecture

## Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         YOUR SETUP                                  │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────────┐         WebSocket          ┌──────────────────┐
│                  │      ws://localhost:8765    │                  │
│  Dashboard       │◄────────────────────────────►│  MCP Server      │
│  (Browser)       │                             │  (Node.js)       │
│                  │                             │                  │
│  - Vibration UI  │                             │  - 13 Tools      │
│  - Charts        │                             │  - 3 Resources   │
│  - Controls      │                             │  - State Cache   │
└────────┬─────────┘                             └────────┬─────────┘
         │                                                 │
         │                                                 │
         │ MQTT Protocol                                   │ MCP Protocol
         │ (ws/wss)                                        │ (stdio)
         │                                                 │
         ▼                                                 ▼
┌──────────────────┐                             ┌──────────────────┐
│                  │                             │                  │
│  MQTT Broker     │                             │  Claude Desktop  │
│                  │                             │                  │
│  - HiveMQ        │                             │  - AI Assistant  │
│  - Topics        │                             │  - Commands      │
│  - Messages      │                             │  - Monitoring    │
│                  │                             │                  │
└──────────────────┘                             └──────────────────┘
         ▲                                                 │
         │                                                 │
         │ MQTT/WiFi                                       │ User Input
         │                                                 │
         │                                                 ▼
┌──────────────────┐                             ┌──────────────────┐
│                  │                             │                  │
│  Phantom Sensor  │                             │      User        │
│  EPH-V11E        │                             │                  │
│                  │                             │                  │
│  - Vibration     │                             │  - Questions     │
│  - Temperature   │                             │  - Commands      │
│  - Battery       │                             │  - Analysis      │
│  - Signal        │                             │                  │
│                  │                             │                  │
└──────────────────┘                             └──────────────────┘
```

## Data Flow

### 1. Sensor → Dashboard
```
Phantom Sensor → MQTT Broker → Dashboard (Browser)
    - Real-time vibration data
    - Temperature readings
    - Battery status
    - Signal strength
```

### 2. Dashboard → MCP Server
```
Dashboard (Browser) → WebSocket → MCP Server
    - Sensor data updates
    - Device information
    - MQTT connection status
    - Message logs
```

### 3. AI → MCP Server → Dashboard
```
User → Claude Desktop → MCP Server → Dashboard
    "Check sensor status"
         ↓
    MCP Server requests data
         ↓
    Dashboard responds
         ↓
    Claude shows results to user
```

## Communication Protocols

### WebSocket (Dashboard ↔ MCP Server)
- **URL:** `ws://localhost:8765`
- **Format:** JSON messages
- **Direction:** Bidirectional
- **Features:** Auto-reconnect, request/response pattern

**Message Examples:**
```json
// Dashboard → MCP (sensor data)
{
  "type": "sensorData",
  "data": {
    "rms": [0.45, 0.52, 0.38],
    "temperature": 42.3,
    "battery": 3.2,
    "rssi": -65
  }
}

// MCP → Dashboard (command)
{
  "type": "getSensorData",
  "requestId": "12345"
}

// Dashboard → MCP (response)
{
  "requestId": "12345",
  "success": true,
  "result": { "vibration": {...}, "temperature": {...} }
}
```

### MCP Protocol (Claude ↔ MCP Server)
- **Transport:** stdio (standard input/output)
- **Format:** JSON-RPC 2.0
- **Direction:** Bidirectional
- **Features:** Tools, Resources, Prompts

**Tool Call Example:**
```json
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "get_sensor_data",
    "arguments": {}
  },
  "id": 1
}
```

### MQTT (Sensor → Dashboard)
- **Broker:** HiveMQ Cloud (or custom)
- **Protocol:** WSS (WebSocket Secure)
- **Topics:** `phantom/+/+/stateupdate`
- **Format:** JSON payloads

**MQTT Message Example:**
```json
{
  "friendlyName": "Machine #1",
  "phantomCode": "EPH12345",
  "rms": [0.45, 0.52, 0.38],
  "temperature": 42.3,
  "battery": 3.2,
  "rssi": -65,
  "timestamp": 1737977234
}
```

## State Management

### MCP Server State Cache
```javascript
{
  connected: true,              // Dashboard connection
  mqttConnected: true,          // MQTT connection
  sensorData: {...},            // Latest readings
  deviceInfo: {...},            // Device metadata
  logs: [...],                  // Message history (last 100)
  settings: {...},              // MQTT configuration
  lastUpdate: "2026-01-27T..."  // Last state update
}
```

### Dashboard State
```javascript
{
  client: mqtt.Client,          // MQTT client
  isConnected: boolean,         // MQTT status
  messageCount: number,         // Total messages
  sessionStartTime: timestamp,  // Session start
  vibrationHistory: {...},      // Last 50 readings
  temperatureHistory: {...},    // Last 50 readings
  currentConfig: {...}          // MQTT settings
}
```

## File Structure

```
Vibration sensor/
│
├── Frontend (Browser)
│   └── index.html                      Dashboard UI + WebSocket client
│
├── Backend (Node.js)
│   ├── mcp-server.js                   MCP server + WebSocket server
│   └── package.json                    Dependencies
│
├── Configuration
│   ├── claude_desktop_config.example.json   Claude Desktop config
│   └── .gitignore                           Git ignore rules
│
├── Scripts
│   ├── start.bat                       Windows startup
│   ├── start.sh                        Unix startup
│   └── test-mcp.js                     Automated tests
│
└── Documentation
    ├── README-MCP.md                   Complete guide
    ├── QUICKSTART.md                   Quick setup
    ├── TEST-REPORT.md                  Test results
    ├── ARCHITECTURE.md                 This file
    └── INSTALLATION-SUCCESS.txt        Installation summary
```

## Security Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ Local Machine (Trusted)                                 │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  Dashboard   │ ◄─────► │ MCP Server   │             │
│  │  (Browser)   │  Local  │  (Node.js)   │             │
│  └──────────────┘  WS     └──────────────┘             │
│                                                          │
│         │                         │                     │
└─────────┼─────────────────────────┼─────────────────────┘
          │                         │
          │ WSS/TLS                 │ (No external access)
          │                         │
          ▼                         ▼
┌─────────────────┐         ┌──────────────┐
│ MQTT Broker     │         │ Claude API   │
│ (Internet)      │         │ (Internet)   │
└─────────────────┘         └──────────────┘
```

**Security Notes:**
- WebSocket traffic stays on localhost (127.0.0.1)
- No external WebSocket exposure
- MQTT credentials stored in browser localStorage only
- MCP server has no internet access
- All AI communication goes through Claude Desktop

## Performance Characteristics

| Operation | Latency | Throughput |
|-----------|---------|------------|
| WebSocket message | < 1ms | > 1000 msg/s |
| MCP tool call | < 10ms | Limited by I/O |
| MQTT message | ~50-200ms | Depends on broker |
| Chart update | ~16ms (60 FPS) | 50 points |
| State sync | < 5ms | Real-time |

## Scalability

**Current Limits:**
- Dashboard: 1 instance (browser tab)
- MCP Server: 1 instance (per Claude Desktop)
- Sensors: Unlimited (via MQTT topics)
- History: 50 data points per metric

**To Scale:**
- Use MQTT topic wildcards for multiple sensors
- Store history in database instead of memory
- Add multiple dashboards (one per sensor)
- Deploy MCP server as system service

## Error Handling

### Connection Loss
```
Dashboard ←→ MCP Server: Auto-reconnect every 5s
Dashboard ←→ MQTT Broker: Auto-reconnect (MQTT.js)
Claude ←→ MCP Server: Claude Desktop manages
```

### Invalid Data
- Dashboard validates sensor readings
- MCP Server validates command parameters
- Failed commands return error responses
- Logs capture all errors

### Timeout Handling
- MCP commands timeout after 5 seconds
- WebSocket connection timeout: 30 seconds
- MQTT connection timeout: 30 seconds

## Future Enhancements

1. **Authentication**
   - Add JWT tokens for WebSocket
   - API keys for MCP access
   - User management

2. **Persistence**
   - PostgreSQL/TimescaleDB for history
   - Redis for real-time cache
   - File export (CSV, Excel)

3. **Notifications**
   - Email alerts on threshold breach
   - SMS notifications
   - Webhook integrations

4. **Analytics**
   - ML-based anomaly detection
   - Predictive maintenance
   - Custom dashboards

5. **Multi-tenant**
   - Multiple users
   - Multiple sensors
   - Role-based access control
