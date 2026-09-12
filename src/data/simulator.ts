import type { ObservationNode, SensorReading, EnvironmentalEvent, RobotState, SystemHealth, ForestIndex, Alert, ForestStatus, NodeState } from '../types';

const SECTORS = ['A1','A2','A3','B1','B2','B3','C1','C2','C3','D1','D2','D3'];
const GRID = [
  { id: 'N01', label: 'Node 01', x: 0.15, y: 0.15, sector: 'A1' },
  { id: 'N02', label: 'Node 02', x: 0.5,  y: 0.15, sector: 'A2' },
  { id: 'N03', label: 'Node 03', x: 0.85, y: 0.15, sector: 'A3' },
  { id: 'N04', label: 'Node 04', x: 0.15, y: 0.5,  sector: 'B1' },
  { id: 'N05', label: 'Node 05', x: 0.5,  y: 0.5,  sector: 'B2' },
  { id: 'N06', label: 'Node 06', x: 0.85, y: 0.5,  sector: 'B3' },
  { id: 'N07', label: 'Node 07', x: 0.15, y: 0.85, sector: 'C1' },
  { id: 'N08', label: 'Node 08', x: 0.5,  y: 0.85, sector: 'C2' },
  { id: 'N09', label: 'Node 09', x: 0.85, y: 0.85, sector: 'C3' },
  { id: 'N10', label: 'Node 10', x: 0.32, y: 0.32, sector: 'D1' },
  { id: 'N11', label: 'Node 11', x: 0.68, y: 0.32, sector: 'D2' },
  { id: 'N12', label: 'Node 12', x: 0.5,  y: 0.68, sector: 'D3' },
];

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomAround(base: number, variance: number) {
  return base + (Math.random() - 0.5) * variance;
}

export function createInitialNodes(): ObservationNode[] {
  const now = Date.now();
  return GRID.map((g, i) => {
    const baseTemp = 28 + Math.random() * 4;
    const baseHum = 45 + Math.random() * 15;
    return {
      id: g.id,
      label: g.label,
      x: g.x,
      y: g.y,
      sector: g.sector,
      state: 'normal' as NodeState,
      reading: {
        temperature: baseTemp,
        humidity: baseHum,
        airQuality: 15 + Math.random() * 10,
        particulate: 8 + Math.random() * 8,
        acoustic: Math.random() * 5,
        timestamp: now,
      },
      baseline: {
        tempMin: baseTemp - 3,
        tempMax: baseTemp + 4,
        humidityMin: baseHum - 10,
        humidityMax: baseHum + 12,
        particulateTypical: 12,
        established: true,
        lastCalibration: new Date(now - 86400000 * (3 + i)).toISOString().slice(0, 10),
      },
      battery: 70 + Math.random() * 28,
      signal: 85 + Math.random() * 15,
      health: 'GOOD',
      lastSeen: now,
      confidence: 92 + Math.random() * 7,
      history: [
        { time: '14:20', state: 'normal', note: 'Baseline stable' },
      ],
      priority: 'NORMAL',
    };
  });
}

export function createInitialRobot(): RobotState {
  return {
    id: 'VERIFIER-01',
    status: 'STANDBY',
    battery: 94,
    sector: 'HQ',
    x: 0.5,
    y: 0.95,
    distanceTravelled: 0,
    obstacle: false,
    signal: 98,
    missionTime: 0,
  };
}

export function createInitialHealth(nodes: ObservationNode[]): SystemHealth {
  return {
    nodesOnline: nodes.filter(n => n.state !== 'offline').length,
    nodesTotal: nodes.length,
    gateway: 'ONLINE',
    robot: 'STANDBY',
    database: 'ONLINE',
    communication: 'GOOD',
    sensorIntegrity: 94,
    lastSync: Date.now(),
  };
}

export function computeForestIndex(nodes: ObservationNode[]): ForestIndex {
  const active = nodes.filter(n => n.state !== 'offline');
  if (active.length === 0) {
    return { overall: 0, thermal: 0, atmospheric: 0, dryness: 0, anomalyStability: 0, networkConfidence: 0 };
  }
  const avgTemp = active.reduce((s, n) => s + n.reading.temperature, 0) / active.length;
  const avgHum = active.reduce((s, n) => s + n.reading.humidity, 0) / active.length;
  const avgAQ = active.reduce((s, n) => s + n.reading.airQuality, 0) / active.length;
  const avgPart = active.reduce((s, n) => s + n.reading.particulate, 0) / active.length;
  const anomalyCount = active.filter(n => n.state !== 'normal').length;

  const thermal = clamp(100 - (avgTemp - 25) * 4, 40, 98);
  const atmospheric = clamp(100 - avgAQ * 1.2, 35, 98);
  const dryness = clamp(avgHum * 1.4, 30, 95);
  const anomalyStability = clamp(100 - anomalyCount * 18, 20, 99);
  const networkConfidence = clamp(active.length / nodes.length * 100 - (100 - active[0]?.confidence || 0) * 0.1, 50, 99);
  const overall = Math.round((thermal + atmospheric + dryness + anomalyStability + networkConfidence) / 5);

  return {
    overall,
    thermal: Math.round(thermal),
    atmospheric: Math.round(atmospheric),
    dryness: Math.round(dryness),
    anomalyStability: Math.round(anomalyStability),
    networkConfidence: Math.round(networkConfidence),
  };
}

export function deriveForestStatus(nodes: ObservationNode[], events: EnvironmentalEvent[]): ForestStatus {
  if (events.some(e => e.status !== 'RESOLVED' && e.confidence >= 85)) return 'CRITICAL';
  if (events.some(e => e.status !== 'RESOLVED' && e.confidence >= 65)) return 'ELEVATED';
  if (nodes.some(n => n.state === 'suspicious' || n.state === 'critical' || n.state === 'watch')) return 'WATCH';
  return 'NORMAL';
}

export function tickSimulation(
  nodes: ObservationNode[],
  robot: RobotState,
  events: EnvironmentalEvent[],
  simMode: boolean,
  simIntensity: number
): { nodes: ObservationNode[]; robot: RobotState; events: EnvironmentalEvent[]; newAlerts: Alert[] } {
  const now = Date.now();
  const newAlerts: Alert[] = [];
  let nextNodes = nodes.map(n => {
    if (n.state === 'offline') return n;
    const drift = simMode ? simIntensity : 0.15;
    const reading: SensorReading = {
      temperature: clamp(n.reading.temperature + randomAround(0, drift), 18, 55),
      humidity: clamp(n.reading.humidity + randomAround(0, drift * 1.5), 10, 90),
      airQuality: clamp(n.reading.airQuality + randomAround(0, drift * 0.8), 5, 100),
      particulate: clamp(n.reading.particulate + randomAround(0, drift * 0.6), 2, 100),
      acoustic: clamp(n.reading.acoustic + randomAround(0, 1), 0, 100),
      timestamp: now,
    };

    // simple anomaly detection vs baseline
    let state: NodeState = 'normal';
    const tempDelta = reading.temperature - ((n.baseline.tempMin + n.baseline.tempMax) / 2);
    const humDelta = ((n.baseline.humidityMin + n.baseline.humidityMax) / 2) - reading.humidity;
    if (tempDelta > 8 || reading.particulate > 45 || reading.airQuality > 55) state = 'critical';
    else if (tempDelta > 5 || humDelta > 12 || reading.particulate > 30) state = 'suspicious';
    else if (tempDelta > 3 || humDelta > 7 || reading.particulate > 20) state = 'watch';

    return {
      ...n,
      reading,
      state,
      lastSeen: now,
      battery: clamp(n.battery - 0.002, 5, 100),
      signal: clamp(n.signal + randomAround(0, 1), 40, 100),
    };
  });

  // Adaptive prioritization: raise neighbours of elevated nodes
  nextNodes = nextNodes.map(n => {
    if (n.state === 'offline' || n.state === 'critical' || n.state === 'suspicious') {
      return { ...n, priority: 'PRIMARY' as const };
    }
    const neighbours = nextNodes.filter(o => 
      o.id !== n.id && Math.hypot(o.x - n.x, o.y - n.y) < 0.35 && (o.state === 'critical' || o.state === 'suspicious')
    );
    if (neighbours.length > 0) return { ...n, priority: 'SECONDARY' as const };
    return { ...n, priority: 'NORMAL' as const };
  });

  // Robot movement if en route
  let nextRobot = { ...robot };
  if (robot.status === 'EN_ROUTE' && robot.targetX != null && robot.targetY != null) {
    const dx = robot.targetX - robot.x;
    const dy = robot.targetY - robot.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.03) {
      nextRobot = {
        ...robot,
        x: robot.targetX,
        y: robot.targetY,
        status: 'VERIFYING',
        sector: robot.targetSector || robot.sector,
        missionTime: robot.missionTime + 1,
        reading: {
          temperature: 0,
          humidity: 0,
          airQuality: 0,
          particulate: 0,
          acoustic: 0,
          timestamp: now,
        },
      };
      // copy nearby node reading with slight variance
      const near = nextNodes.find(n => n.sector === robot.targetSector) || nextNodes[0];
      if (near) {
        nextRobot.reading = {
          temperature: near.reading.temperature + randomAround(0, 0.8),
          humidity: near.reading.humidity + randomAround(0, 1.5),
          airQuality: near.reading.airQuality + randomAround(0, 2),
          particulate: near.reading.particulate + randomAround(0, 1.5),
          acoustic: near.reading.acoustic + randomAround(0, 3),
          timestamp: now,
        };
      }
    } else {
      const step = 0.018;
      nextRobot = {
        ...robot,
        x: robot.x + (dx / dist) * step,
        y: robot.y + (dy / dist) * step,
        distanceTravelled: robot.distanceTravelled + step * 120,
        missionTime: robot.missionTime + 1,
        battery: clamp(robot.battery - 0.05, 5, 100),
      };
    }
  } else if (robot.status === 'VERIFYING') {
    nextRobot.missionTime += 1;
    if (robot.missionTime > 25) {
      nextRobot = { ...robot, status: 'RETURNING', missionTime: 0 };
    }
  } else if (robot.status === 'RETURNING') {
    const dx = 0.5 - robot.x;
    const dy = 0.95 - robot.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.03) {
      nextRobot = { ...robot, x: 0.5, y: 0.95, status: 'STANDBY', sector: 'HQ', targetSector: undefined, targetX: undefined, targetY: undefined };
    } else {
      const step = 0.02;
      nextRobot = {
        ...robot,
        x: robot.x + (dx / dist) * step,
        y: robot.y + (dy / dist) * step,
        battery: clamp(robot.battery - 0.04, 5, 100),
      };
    }
  }

  // Simple event generation from cluster of elevated nodes
  let nextEvents = [...events];
  const elevated = nextNodes.filter(n => n.state === 'suspicious' || n.state === 'critical');
  if (elevated.length >= 2 && !nextEvents.some(e => e.status !== 'RESOLVED')) {
    const primary = elevated[0];
    const conf = clamp(55 + elevated.length * 12 + (primary.reading.particulate > 25 ? 10 : 0), 60, 96);
    const event: EnvironmentalEvent = {
      id: `FE-2026-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      sector: primary.sector,
      status: elevated.length >= 3 ? 'CORROBORATED' : 'SUSPICIOUS',
      confidence: conf,
      startedAt: now,
      evidence: [
        { key: 'temp', label: 'Temperature anomaly', status: primary.reading.temperature > 34 ? 'confirmed' : 'incomplete' },
        { key: 'hum', label: 'Humidity decline', status: primary.reading.humidity < 35 ? 'confirmed' : 'incomplete' },
        { key: 'part', label: 'Particulate increase', status: primary.reading.particulate > 25 ? 'confirmed' : 'incomplete' },
        { key: 'neigh', label: 'Neighbour confirmation', status: elevated.length >= 2 ? 'confirmed' : 'missing' },
        { key: 'robot', label: 'Robot verification', status: 'pending' },
        { key: 'persist', label: 'Persistent anomaly', status: 'confirmed' },
      ],
      affectedNodes: elevated.map(n => n.id),
      description: `Multi-node environmental anomaly in sector ${primary.sector}`,
      why: [
        `Temperature increased by ${(primary.reading.temperature - 30).toFixed(1)}°C relative to local baseline.`,
        `Relative humidity decreased relative to baseline.`,
        elevated.length >= 2 ? `${elevated.length} neighbouring nodes reported compatible changes.` : 'Single node anomaly.',
        'Anomaly persisted beyond minimum confirmation window.',
      ],
      conclusion: conf >= 80
        ? 'Strong environmental anomaly requiring verification.'
        : 'Elevated environmental anomaly under observation.',
    };
    nextEvents = [event, ...nextEvents];
    newAlerts.push({
      id: `A-${now}`,
      level: conf >= 85 ? 'CRITICAL' : conf >= 70 ? 'HIGH_PRIORITY' : 'WARNING',
      title: `Anomaly detected — Sector ${primary.sector}`,
      message: event.conclusion,
      timestamp: now,
      sector: primary.sector,
      eventId: event.id,
      read: false,
    });
  }

  // Update event confidence / phase based on robot
  nextEvents = nextEvents.map(e => {
    if (e.status === 'RESOLVED') return e;
    if (nextRobot.status === 'VERIFYING' && nextRobot.targetSector === e.sector) {
      return {
        ...e,
        status: 'VERIFIED' as const,
        confidence: clamp(e.confidence + 8, 0, 99),
        evidence: e.evidence.map(ev => ev.key === 'robot' ? { ...ev, status: 'confirmed' as const } : ev),
      };
    }
    if (nextRobot.status === 'EN_ROUTE' && nextRobot.targetSector === e.sector) {
      return { ...e, status: 'ROBOT_DISPATCHED' as const };
    }
    return e;
  });

  return { nodes: nextNodes, robot: nextRobot, events: nextEvents, newAlerts };
}

export function applySimScenario(
  nodes: ObservationNode[],
  sector: string,
  intensity: 'low' | 'medium' | 'high'
): ObservationNode[] {
  const boost = intensity === 'high' ? 12 : intensity === 'medium' ? 7 : 3.5;
  return nodes.map(n => {
    if (n.sector !== sector && Math.hypot(n.x - 0.5, n.y - 0.5) > 0.4) return n;
    const isPrimary = n.sector === sector;
    return {
      ...n,
      reading: {
        ...n.reading,
        temperature: n.reading.temperature + (isPrimary ? boost : boost * 0.5),
        humidity: n.reading.humidity - (isPrimary ? boost * 1.2 : boost * 0.6),
        particulate: n.reading.particulate + (isPrimary ? boost * 2.5 : boost),
        airQuality: n.reading.airQuality + (isPrimary ? boost * 1.8 : boost * 0.8),
        timestamp: Date.now(),
      },
    };
  });
}

export { SECTORS };
