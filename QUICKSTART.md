# Quick Start Guide

Get your AI-powered vibration sensor monitoring up and running in 5 minutes!

## Step 1: Install Dependencies (1 minute)

Open a terminal in the project directory and run:

```bash
npm install
```

## Step 2: Configure Claude Desktop (2 minutes)

1. Find your Claude Desktop config file:
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Copy the configuration from `claude_desktop_config.example.json`

3. Update the path if your project is in a different location

4. Save the file

## Step 3: Start the Dashboard (1 minute)

1. Open `index.html` in your web browser
2. The dashboard will automatically connect to the MCP server
3. You should see "Connected to MCP server" in the browser console (F12)

## Step 4: Restart Claude Desktop (30 seconds)

Restart Claude Desktop to load the new MCP server.

## Step 5: Test It Out! (30 seconds)

In Claude Desktop, try these commands:

```
Check the dashboard status
```

```
What are the current sensor readings?
```

```
Connect to the MQTT broker
```

## That's It!

Your AI assistant can now:
- ✅ Monitor real-time sensor data
- ✅ Analyze vibration trends
- ✅ Control MQTT connections
- ✅ Configure broker settings
- ✅ Access historical data

## Need Help?

See the full documentation in `README-MCP.md`

## Common Issues

### "Dashboard not connected" error
- Make sure `index.html` is open in your browser
- Check the browser console for WebSocket connection errors
- Verify port 8765 is not blocked

### MCP server not appearing in Claude
- Check the path in `claude_desktop_config.json`
- Restart Claude Desktop
- Look for errors in Claude Desktop logs

### Can't connect to MQTT
- Verify your MQTT broker settings in the dashboard
- Check if the broker is accessible from your network
- Try clicking "Settings" in the dashboard to configure
