export type NodeState = 'normal' | 'watch' | 'suspicious' | 'critical' | 'offline';
export type ForestStatus = 'NORMAL' | 'WATCH' | 'ELEVATED' | 'CRITICAL';
export type RobotStatus = 'STANDBY' | 'EN_ROUTE' | 'VERIFYING' | 'RETURNING' | 'OFFLINE';
export type EventPhase = 'ANOMALY' | 'SUSPICIOUS' | 'CORROBORATED' | 'LOCALIZED' | 'ROBOT_DISPATCHED' | 'VERIFIED' | 'RESOLVED';
export type AlertLevel = 'INFORMATION' | 'WARNING' | 'HIGH_PRIORITY' | 'CRITICAL';

export interface SensorReading {
  temperature: number;
  humidity: number;
  airQuality: number; // 0-100, higher = worse
  particulate: number; // 0-100
  acoustic: number; // anomaly score 0-100
  timestamp: number;
}

export interface NodeBaseline {
  tempMin: number;
  tempMax: number;
  humidityMin: number;
  humidityMax: number;
  particulateTypical: number;
  established: boolean;
  lastCalibration: string;
}

export interface ObservationNode {
  id: string;
  label: string;
  x: number; // grid 0-1
  y: number;
  sector: string;
  state: NodeState;
  reading: SensorReading;
  baseline: NodeBaseline;
  battery: number;
  signal: number;
  health: 'GOOD' | 'DEGRADED' | 'POOR';
  lastSeen: number;
  confidence: number;
  history: { time: string; state: NodeState; note: string }[];
  priority: 'NORMAL' | 'SECONDARY' | 'PRIMARY';
}

export interface EvidenceItem {
  key: string;
  label: string;
  status: 'confirmed' | 'pending' | 'missing' | 'incomplete';
}

export interface EnvironmentalEvent {
  id: string;
  sector: string;
  status: EventPhase;
  confidence: number;
  startedAt: number;
  evidence: EvidenceItem[];
  affectedNodes: string[];
  description: string;
  why: string[];
  conclusion: string;
  robotMissionId?: string;
}

export interface RobotState {
  id: string;
  status: RobotStatus;
  battery: number;
  sector: string;
  x: number;
  y: number;
  targetSector?: string;
  targetX?: number;
  targetY?: number;
  missionId?: string;
  distanceTravelled: number;
  obstacle: boolean;
  signal: number;
  reading?: SensorReading;
  missionTime: number;
}

export interface SystemHealth {
  nodesOnline: number;
  nodesTotal: number;
  gateway: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  robot: RobotStatus;
  database: 'ONLINE' | 'OFFLINE';
  communication: 'GOOD' | 'DEGRADED' | 'POOR';
  sensorIntegrity: number;
  lastSync: number;
}

export interface ForestIndex {
  overall: number;
  thermal: number;
  atmospheric: number;
  dryness: number;
  anomalyStability: number;
  networkConfidence: number;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  timestamp: number;
  sector?: string;
  eventId?: string;
  read: boolean;
}

export interface SimulationParams {
  temperatureDelta: number;
  humidityDelta: number;
  windDirection: number; // degrees
  windIntensity: number;
  dryness: number;
  particulate: number;
  eventSector: string;
  intensity: 'low' | 'medium' | 'high';
  running: boolean;
}
