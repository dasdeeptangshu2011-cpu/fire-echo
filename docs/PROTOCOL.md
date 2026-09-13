# FIRE-ECHO 2.0 Protocol

## Transport
Primary prototype transport: Bluetooth Low Energy between Android browser/PWA and ESP32 gateway.

## UUIDs
```text
Service      7b6f0001-6d1e-4e5a-9a31-464952452d01
Telemetry    7b6f0002-6d1e-4e5a-9a31-464952452d01
Command      7b6f0003-6d1e-4e5a-9a31-464952452d01
Status       7b6f0004-6d1e-4e5a-9a31-464952452d01
```

## Sentinel telemetry
```json
{"type":"sentinel_telemetry","deviceId":"S03","timestamp":1720000000,"temperature":31.8,"humidity":47.2,"smoke":184,"flame":false,"battery":87,"signal":-61,"quality":96}
```

Required numeric fields are validated before application state is changed. Malformed packets are rejected.

## Robot telemetry
```json
{"type":"robot_telemetry","robotId":"R01","timestamp":1720000000,"x":4.2,"y":7.8,"temperature":33.1,"humidity":41.5,"smoke":92,"battery":76,"obstacle":false,"motor":"MOVING","mission":"VERIFY_B4"}
```

## Commands
```json
{"type":"robot_command","command":"START_MISSION","target":{"x":8,"y":5}}
```

Supported commands: `START`, `STOP`, `PAUSE`, `RESUME`, `RETURN_HOME`, `START_MISSION`, `VERIFY_TARGET`.

The application must only show real acknowledgement after the physical gateway/robot supplies an acknowledgement. Simulation acknowledgement is explicitly labelled SIMULATION ACK.

## Provenance
Application values are labelled REAL, CALCULATED, ESTIMATED, SIMULATION, or OFFLINE/REPLAY. Simulated values never become real merely because a gateway is present.
