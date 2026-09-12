# FIRE-ECHO ESP32 firmware

The web dashboard expects a BLE gateway service:

- Service: `7b6f0001-6d1e-4e5a-9a31-464952452d01`
- Telemetry: `7b6f0002-6d1e-4e5a-9a31-464952452d01`
- Command: `7b6f0003-6d1e-4e5a-9a31-464952452d01`
- Status: `7b6f0004-6d1e-4e5a-9a31-464952452d01`
- Config: `7b6f0005-6d1e-4e5a-9a31-464952452d01`

Telemetry is newline-delimited JSON. Example:

```json
{"type":"telemetry","source":"REAL","sentinel":"S-05","x":56,"y":58,"temperature":34.2,"humidity":51,"smoke":27,"flame":0.2,"battery":88,"signal":82,"timestamp":1750000000}
```

Robot commands should be acknowledged:

```json
{"type":"mission","x":56,"y":58,"mode":"VERIFY"}
```

```json
{"type":"ack","command":"VERIFY","status":"ACCEPTED"}
```

The supplied sketches are starting points for Arduino IDE + ESP32. They intentionally use safe sensor simulation where a physical sensor has not yet been installed.
