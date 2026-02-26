# Vibration Sensor MCP Server

AI-powered control and monitoring for the Primatronic Erbessd Phantom vibration sensor dashboard using the Model Context Protocol (MCP).

## Overview

This MCP server enables AI assistants (like Claude) to monitor and control your vibration sensor dashboard in real-time. The server acts as a bridge between the AI and your dashboard, providing tools for:

- **Real-time Monitoring**: Get current sensor readings (vibration, temperature, battery, signal)
- **Device Management**: View device information and connection status
- **MQTT Control**: Connect, disconnect, and configure MQTT broker settings
- **Data Analysis**: Access historical data and logs
- **Dashboard Control**: Toggle theme and clear logs

## Architecture

```
┌─────────────┐         WebSocket          ┌─────────────┐         MCP Protocol      ┌─────────────┐
│  Dashboard  │◄──────────────────────────►│ MCP Server  │◄──────────────────────────►│  Claude AI  │
│ (Browser)   │    ws://localhost:8765     │  (Node.js)  │         stdio             │             │
└─────────────┘                            └─────────────┘                           └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
  ┌────────┐                                  ┌────────┐
  │  MQTT  │                                  │  MCP   │
  │ Broker │                                  │  Tools │
  └────────┘                                  └────────┘
```

## Installation

### 1. Install Dependencies

```bash
cd "C:\Users\user\Desktop\Vibration sensor"
npm install
```

### 2. Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration:

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "vibration-sensor": {
      "command": "node",
      "args": [
        "C:\\Users\\user\\Desktop\\Vibration sensor\\mcp-server.js"
      ]
    }
  }
}
```

### 3. Start the Dashboard

Open `index.html` in your web browser. The dashboard will automatically connect to the MCP server on `ws://localhost:8765`.

### 4. Restart Claude Desktop

Restart Claude Desktop to load the new MCP server configuration.

## Available Tools

### Monitoring Tools

#### `get_dashboard_status`
Get the current status of the dashboard including connection state and last update time.

**Example:**
```
Get the dashboard status
```

#### `get_sensor_data`
Get current sensor readings including vibration (X, Y, Z axes), temperature, battery, and signal strength.

**Example:**
```
What are the current vibration readings?
```

#### `get_device_info`
Get device information including friendly name, phantom code, gateway serial, and update interval.

**Example:**
```
Show me the device information
```

#### `get_message_logs`
Get recent MQTT message logs (default: last 50 messages).

**Parameters:**
- `limit` (optional): Maximum number of log entries to return

**Example:**
```
Show me the last 20 message logs
```

### Data Analysis Tools

#### `get_vibration_history`
Get historical vibration data for all three axes with timestamps.

**Example:**
```
Show me the vibration history for the past hour
```

#### `get_temperature_history`
Get historical temperature data with timestamps.

**Example:**
```
What's the temperature trend?
```

#### `get_alert_thresholds`
Get ISO 10816 vibration severity thresholds and battery/temperature ranges.

**Example:**
```
What are the vibration alert thresholds?
```

### Control Tools

#### `get_mqtt_settings`
Get current MQTT broker settings including host, port, protocol, and subscribed topics.

**Example:**
```
Show me the current MQTT settings
```

#### `update_mqtt_settings`
Update MQTT broker settings and reconnect.

**Parameters:**
- `host` (required): MQTT broker hostname
- `port` (required): MQTT broker port
- `protocol` (required): "ws" or "wss"
- `username` (optional): MQTT username
- `password` (optional): MQTT password
- `topics` (required): Array of topic patterns

**Example:**
```
Update the MQTT broker to use host "broker.example.com" on port 8883 with protocol "wss"
```

#### `connect_mqtt`
Connect to the MQTT broker using current settings.

**Example:**
```
Connect to the MQTT broker
```

#### `disconnect_mqtt`
Disconnect from the MQTT broker.

**Example:**
```
Disconnect from MQTT
```

#### `clear_message_logs`
Clear the message log in the dashboard.

**Example:**
```
Clear the message logs
```

#### `toggle_theme`
Toggle between light and dark theme.

**Example:**
```
Switch to light mode
```

## Resources

The MCP server also exposes resources that can be read:

- `dashboard://status` - Current dashboard and MQTT connection status
- `dashboard://sensor-data` - Real-time sensor readings
- `dashboard://logs` - Recent message logs

## Usage Examples

### Example 1: Check System Health
```
User: Is the vibration sensor working properly?

Claude: Let me check the sensor status for you.
[Calls get_dashboard_status and get_sensor_data]

The sensor is working properly:
- Dashboard: Connected
- MQTT: Connected
- Vibration levels:
  - X-axis: 0.45 mm/s (Good)
  - Y-axis: 0.52 mm/s (Good)
  - Z-axis: 0.38 mm/s (Good)
- Temperature: 42.3°C
- Battery: 3.2V (89%)
- Signal: -65 dBm (Good)
```

### Example 2: Analyze Trends
```
User: Has the vibration been increasing over time?

Claude: Let me analyze the vibration history.
[Calls get_vibration_history]

Based on the last 50 data points:
- X-axis: Stable around 0.4-0.5 mm/s
- Y-axis: Slight increase from 0.45 to 0.55 mm/s
- Z-axis: Stable around 0.35-0.40 mm/s

The Y-axis shows a slight upward trend but remains within the "Good" range
(below 1.1 mm/s according to ISO 10816).
```

### Example 3: Configure MQTT
```
User: Change the MQTT broker to broker.hivemq.com on port 8884

Claude: I'll update the MQTT settings for you.
[Calls update_mqtt_settings with new parameters]

MQTT settings have been updated and the dashboard is reconnecting to:
- Host: broker.hivemq.com
- Port: 8884
- Protocol: wss
```

## Troubleshooting

### Dashboard Not Connecting to MCP Server

1. Check that the MCP server is running (it starts automatically with Claude Desktop)
2. Verify the WebSocket port 8765 is not blocked by firewall
3. Check browser console for connection errors

### MCP Server Not Showing in Claude Desktop

1. Verify the path in `claude_desktop_config.json` is correct
2. Restart Claude Desktop
3. Check for syntax errors in the configuration file
4. Look for MCP server errors in Claude Desktop logs

### Commands Timing Out

1. Ensure the dashboard is open in your browser
2. Check that the dashboard successfully connected to `ws://localhost:8765`
3. Verify network connectivity between dashboard and MCP server

## Security Considerations

- The MCP server runs locally and only accepts connections from localhost
- MQTT credentials are stored in browser localStorage (not transmitted through MCP)
- WebSocket communication is unencrypted (suitable for localhost only)
- For production use, consider adding authentication and TLS encryption

## Development

### Project Structure

```
Vibration sensor/
├── index.html              # Dashboard UI (with MCP WebSocket client)
├── mcp-server.js          # MCP Server implementation
├── package.json           # Node.js dependencies
└── README-MCP.md          # This file
```

### Extending the MCP Server

To add new tools:

1. Add tool definition in `ListToolsRequestSchema` handler
2. Add tool implementation in `CallToolRequestSchema` handler
3. Add corresponding command handler in `index.html` > `handleMCPCommand()`

### Testing

```bash
# Run the MCP server directly for testing
npm start

# The server will output logs to stderr
# You can test WebSocket connection manually or through the dashboard
```

## License

MIT License - See LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/vibration-sensor-mcp)
- Email: support@primatronic.com

## Credits

Developed by Primatronic SRL for the Erbessd Phantom EPH-V11E Vibration Monitoring System.

Built with:
- [Model Context Protocol SDK](https://github.com/anthropics/modelcontextprotocol)
- [MQTT.js](https://github.com/mqttjs/MQTT.js)
- [Chart.js](https://www.chartjs.org/)
