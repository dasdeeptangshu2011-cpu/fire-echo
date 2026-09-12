import { create } from 'zustand';
import type {
  ObservationNode, RobotState, EnvironmentalEvent, SystemHealth,
  ForestIndex, Alert, ForestStatus, SimulationParams
} from '../types';
import {
  createInitialNodes, createInitialRobot, createInitialHealth,
  computeForestIndex, deriveForestStatus, tickSimulation, applySimScenario
} from '../data/simulator';

interface FireEchoState {
  nodes: ObservationNode[];
  robot: RobotState;
  events: EnvironmentalEvent[];
  alerts: Alert[];
  health: SystemHealth;
  forestIndex: ForestIndex;
  forestStatus: ForestStatus;
  selectedNodeId: string | null;
  selectedEventId: string | null;
  sim: SimulationParams;
  mapLayer: string;
  incidentMode: boolean;
  isOnline: boolean; // local gateway
  tick: number;

  // actions
  bootstrap: () => void;
  simulationTick: () => void;
  selectNode: (id: string | null) => void;
  selectEvent: (id: string | null) => void;
  setMapLayer: (layer: string) => void;
  dispatchRobot: (sector: string) => void;
  cancelRobotMission: () => void;
  startSimulation: (params: Partial<SimulationParams>) => void;
  stopSimulation: () => void;
  setNodeOffline: (id: string) => void;
  markAlertRead: (id: string) => void;
  clearAlerts: () => void;
  setIncidentMode: (v: boolean) => void;
}

export const useFireEchoStore = create<FireEchoState>((set, get) => ({
  nodes: [],
  robot: createInitialRobot(),
  events: [],
  alerts: [],
  health: createInitialHealth([]),
  forestIndex: { overall: 87, thermal: 91, atmospheric: 88, dryness: 76, anomalyStability: 94, networkConfidence: 93 },
  forestStatus: 'NORMAL',
  selectedNodeId: null,
  selectedEventId: null,
  sim: {
    temperatureDelta: 0,
    humidityDelta: 0,
    windDirection: 45,
    windIntensity: 3,
    dryness: 40,
    particulate: 10,
    eventSector: 'B2',
    intensity: 'medium',
    running: false,
  },
  mapLayer: 'network',
  incidentMode: false,
  isOnline: true,
  tick: 0,

  bootstrap: () => {
    const nodes = createInitialNodes();
    const robot = createInitialRobot();
    set({
      nodes,
      robot,
      health: createInitialHealth(nodes),
      forestIndex: computeForestIndex(nodes),
      forestStatus: 'NORMAL',
      events: [],
      alerts: [{
        id: 'boot-1',
        level: 'INFORMATION',
        title: 'FIRE-ECHO Online',
        message: 'Environmental intelligence system initialized. 12/12 nodes reporting.',
        timestamp: Date.now(),
        read: false,
      }],
    });
  },

  simulationTick: () => {
    const { nodes, robot, events, sim } = get();
    const intensity = sim.running
      ? (sim.intensity === 'high' ? 1.8 : sim.intensity === 'medium' ? 0.9 : 0.4)
      : 0.12;
    const result = tickSimulation(nodes, robot, events, sim.running, intensity);
    const index = computeForestIndex(result.nodes);
    const status = deriveForestStatus(result.nodes, result.events);
    const health = createInitialHealth(result.nodes);
    health.robot = result.robot.status;

    set(state => ({
      nodes: result.nodes,
      robot: result.robot,
      events: result.events,
      alerts: [...result.newAlerts, ...state.alerts].slice(0, 40),
      forestIndex: index,
      forestStatus: status,
      health,
      tick: state.tick + 1,
      incidentMode: status === 'CRITICAL' || status === 'ELEVATED' ? true : state.incidentMode,
    }));
  },

  selectNode: (id) => set({ selectedNodeId: id }),
  selectEvent: (id) => set({ selectedEventId: id }),
  setMapLayer: (layer) => set({ mapLayer: layer }),

  dispatchRobot: (sector) => {
    const { nodes, robot, events } = get();
    if (robot.status !== 'STANDBY') return;
    const target = nodes.find(n => n.sector === sector) || nodes[0];
    set({
      robot: {
        ...robot,
        status: 'EN_ROUTE',
        targetSector: sector,
        targetX: target.x,
        targetY: target.y,
        missionId: `M-${Date.now()}`,
        missionTime: 0,
        distanceTravelled: 0,
      },
      events: events.map(e =>
        e.sector === sector && e.status !== 'RESOLVED'
          ? { ...e, status: 'ROBOT_DISPATCHED' as const }
          : e
      ),
      alerts: [{
        id: `robot-${Date.now()}`,
        level: 'HIGH_PRIORITY',
        title: 'Verification robot dispatched',
        message: `VERIFIER-01 en route to Sector ${sector}`,
        timestamp: Date.now(),
        sector,
        read: false,
      }, ...get().alerts],
    });
  },

  cancelRobotMission: () => {
    const { robot } = get();
    if (robot.status === 'STANDBY') return;
    set({
      robot: {
        ...robot,
        status: 'RETURNING',
        targetSector: undefined,
        targetX: undefined,
        targetY: undefined,
      },
    });
  },

  startSimulation: (params) => {
    const current = get().sim;
    const next = { ...current, ...params, running: true };
    let nodes = get().nodes;
    if (params.eventSector) {
      nodes = applySimScenario(nodes, params.eventSector, params.intensity || 'medium');
    }
    set({ sim: next, nodes });
  },

  stopSimulation: () => {
    set(state => ({
      sim: { ...state.sim, running: false },
      nodes: createInitialNodes(),
      events: [],
      forestStatus: 'NORMAL',
      incidentMode: false,
      robot: createInitialRobot(),
    }));
  },

  setNodeOffline: (id) => {
    set(state => ({
      nodes: state.nodes.map(n =>
        n.id === id ? { ...n, state: 'offline' as const, signal: 0 } : n
      ),
    }));
  },

  markAlertRead: (id) => {
    set(state => ({
      alerts: state.alerts.map(a => a.id === id ? { ...a, read: true } : a),
    }));
  },

  clearAlerts: () => set({ alerts: [] }),
  setIncidentMode: (v) => set({ incidentMode: v }),
}));
