# FIRE-ECHO 2.0

FIRE-ECHO is a distributed forest-fire early-warning and environmental intelligence prototype for school robotics research.

## Architecture

**Sentinel mesh → gateway → sensor fusion → adaptive event state → spatial localization → mobile verification → command dashboard**

The system separates data origin explicitly:

- **SIMULATION** — safe synthetic telemetry used for demonstrations.
- **REAL** — telemetry confirmed from a connected ESP32/BLE gateway.
- **OFFLINE/REPLAY** — historical or replayed observations; never presented as live.

## Core ideas

- Sector-specific environmental baselines instead of one global threshold.
- Multi-node weighted fusion and an uncertainty radius for event localization.
- State progression from NORMAL through anomaly/corroboration to a probable/localized event.
- Fault-tolerant network health and explicit sentinel status.
- Mobile robot verification only after the distributed network identifies a suspicious region.
- Shared coordinates across the live map, digital twin, and robot mission target.
- Safe Simulation Lab for competition demonstrations without real fire or hazardous smoke.
- Web Bluetooth Hardware Center for an ESP32 gateway using the FIRE-ECHO service/characteristic protocol.

## Run locally

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

## Hardware protocol

The dashboard reserves the FIRE-ECHO BLE service `7b6f0001-6d1e-4e5a-9a31-464952452d01` with telemetry, command, status, and configuration characteristics under the `...0002` through `...0005` UUIDs.

The current web UI remains honest about hardware state: simulation is not labeled as real telemetry.
