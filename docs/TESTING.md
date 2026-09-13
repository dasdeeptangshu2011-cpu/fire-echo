# FIRE-ECHO 2.0 Testing

## Build
- `npm install`
- `npm run build`
- No experimental TypeScript options.
- No compile-time unused-variable failure.

## Simulation
1. Open Simulation Lab.
2. Confirm `SIMULATION MODE — NO HARDWARE DATA`.
3. Increase event intensity.
4. Observe sentinel telemetry change.
5. Confirm the same fusion/localization result appears on Home and Live Map.
6. Inject a sensor failure and confirm the node becomes offline/degraded.
7. Inject a weak link and confirm reduced quality/risk contribution.
8. Dispatch the simulated robot and confirm `SIMULATION ACK`.

## Hardware
1. Open Hardware Center.
2. Confirm DISCONNECTED before scanning.
3. Scan for the ESP32 gateway.
4. Confirm CONNECTED only after the browser reports a real GATT connection.
5. Send valid JSON telemetry.
6. Confirm node source becomes REAL.
7. Disconnect the gateway and confirm nodes become offline/connection lost.
8. Attempt a robot command while disconnected; it must not be reported as sent.

## Data integrity
- Malformed JSON must be rejected.
- Missing required numeric fields must be rejected.
- Stale telemetry must not remain labelled as live.
- Simulation must never be labelled REAL.
- A single abnormal sensor must not automatically create a corroborated event.

## Localization
- Verify that event position changes when supporting node readings change.
- Verify that uncertainty is visible.
- Never present the estimate as an exact fire coordinate.

## Robot safety
- Physical movement requires operator action.
- STOP is available.
- App sends target/mission; ESP32 handles motor and obstacle logic locally.
- Never test with real fire.
