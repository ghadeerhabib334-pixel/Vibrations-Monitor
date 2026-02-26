Vibration & Temperature Monitoring Dashboard
1. Project Overview
Create a real-time monitoring dashboard that connects to a HiveMQ MQTT broker to visualize data from Erbessd Phantom vibration sensors (Model EPH-V11E).

2. Data Source (Sample JSON)
The AI must parse the following incoming MQTT message format:

JSON

{
  "rssi": -60,
  "phantomCode": 189323759,
  "gwSerial": 589246332,
  "timestamp": 1767950183,
  "friendlyName": "gg",
  "battery": 2.72,
  "temperature": 20.25,
  "updateInterval": 10,
  "rms": [0.08, 0.15, 0.1]
}
3. Connection Requirements (HiveMQ)
Host: db7cfd05d0fc4a508c2a60ff212099df.s1.eu.hivemq.cloud

Port: 8884 (WebSocket Secure)

Authentication: - User: ghadeer

Password: GH123abc

Topic to subscribe: phantom/+/+/stateupdate (or specific gateway topic)

4. Dashboard Requirements & Visuals
A. Key Metrics (Gauges/Cards)
Vibration Severity (RMS): 3 separate gauges for X, Y, and Z axes (from the rms array).

Machine Temperature: A temperature gauge or digital readout (Celsius).

Battery Health: A battery level indicator (Current: 2.72V).

Signal Strength (RSSI): A signal strength bar.

B. Analytical Charts (Time-Series)
Vibration Trend: A multi-line chart showing X, Y, and Z RMS values over time to detect increasing wear.

Temperature Trend: A line chart showing temperature fluctuations.

C. Advanced Features
ISO 10816 Alarms: Color-code the vibration gauges based on standard severity:

Green: < 1.1 mm/s (Good)

Yellow: 1.1 - 2.8 mm/s (Satisfactory)

Orange: 2.8 - 7.1 mm/s (Unsatisfactory)

Red: > 7.1 mm/s (Danger)

Last Seen: A "heartbeat" timer showing how long ago the last message arrived.

5. Suggested Tech Stack
Frontend: React.js or HTML/JavaScript with Tailwind CSS.

Charts: Chart.js or Recharts.

MQTT Library: mqtt.js (for browser-based WebSockets).

How to use this with Claude:
Upload/Paste the plan.md text above.

Tell Claude: "I want to build this dashboard. Please provide the complete HTML and JavaScript code using the mqtt.js library to connect to my HiveMQ broker and display these charts in a modern dark-mode UI."