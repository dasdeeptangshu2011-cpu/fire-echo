# FIRE-ECHO 2.0 — Hardware Setup

## Architecture
Phone/PWA → BLE → ESP32 gateway → sentinel/robot telemetry → normalized application state → fusion/localization → command center.

## Platform
Use ESP32 boards programmed with Arduino IDE. Exact environmental sensors are configurable; do not assume a sensor exists until it is physically wired and calibrated.

## BLE service
- Service: `7b6f0001-6d1e-4e5a-9a31-464952452d01`
- Telemetry: `7b6f0002-6d1e-4e5a-9a31-464952452d01`
- Command: `7b6f0003-6d1e-4e5a-9a31-464952452d01`
- Status: `7b6f0004-6d1e-4e5a-9a31-464952452d01`

## Safe commissioning sequence
1. Program one ESP32 gateway.
2. Verify BLE advertisement and the service UUID.
3. Connect from a browser that supports Web Bluetooth.
4. Send one valid telemetry packet.
5. Confirm the Hardware Center reports a real connection.
6. Add one sentinel at a time.
7. Calibrate sensors against a trusted reference.
8. Add the robot only after the gateway/sentinel path is stable.

Never use a flame or hazardous smoke to test the system. Use the Simulation Lab for competition demonstrations.

## Power
Use an appropriate regulated supply for the selected ESP32 board and sensors. Keep motor power separate from logic power where the motor driver requires it, with a common ground as specified by the driver documentation.

## Beginner troubleshooting
- BLE unavailable: use a compatible browser/device.
- Device visible but service unavailable: verify the UUIDs and firmware.
- Telemetry rejected: validate JSON fields and numeric values.
- Stale node: inspect timestamps and connection state.
- Robot command not sent: Hardware Center must show CONNECTED.
