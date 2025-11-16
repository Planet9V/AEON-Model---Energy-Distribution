
import { GridMetrics, GridSettings, SystemStatus, Substation, ComponentStatus, TransmissionLine } from './types';

export const SIMULATION_TICK_RATE = 1000; // ms

export const GRID_PARAMS = {
  plant: {
    min: 50,
    max: 600,
    unit: 'MW',
    rampRate: 10, // MW per tick
  },
  voltage: { min: 0.9, max: 1.1, unit: 'p.u.' },
  frequency: { min: 59.5, max: 60.5, unit: 'Hz' },
  poles: 2,
  inertia: 4, // s (System inertia constant H)
};

export const OPERATIONAL_LIMITS = {
  temperature: 150, // °C
  voltageTolerance: 0.05, // ±5%
  frequencyTolerance: 0.02, // ±2% from 60Hz
  rocf: -1.0, // Hz/s, critical threshold for trip
};

export const INITIAL_GRID_METRICS: GridMetrics = {
  plantOutput: 0,
  cityLoad: 200,
  totalDemand: 200,
  gridFrequency: 60.0,
  systemVoltage: 1.0,
  temperature: 25,
  rocf: 0,
};

export const INITIAL_GRID_SETTINGS: GridSettings = {
  plantDispatch: 50,
  targetVoltage: 1.0,
  targetFrequency: 60,
};

export const INITIAL_SUBSTATIONS: Substation[] = Array.from({ length: 7 }, (_, i) => ({
  id: i + 1,
  name: `SUB-0${i + 1}`,
  status: ComponentStatus.OFFLINE,
  load: 0,
  voltage: 0,
}));

export const INITIAL_TRANSMISSION_LINES: TransmissionLine[] = Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    from: 'PLANT',
    to: i + 1,
    status: ComponentStatus.OFFLINE,
}));


export const STATUS_STYLES: Record<SystemStatus, { text: string; bg: string; ring: string }> = {
  [SystemStatus.OFFLINE]: { text: 'text-gray-300', bg: 'bg-gray-700', ring: 'ring-gray-500' },
  [SystemStatus.ENERGIZING]: { text: 'text-blue-300', bg: 'bg-blue-700', ring: 'ring-blue-500' },
  [SystemStatus.STABLE]: { text: 'text-green-300', bg: 'bg-green-700', ring: 'ring-green-500' },
  [SystemStatus.SHUTTING_DOWN]: { text: 'text-yellow-300', bg: 'bg-yellow-700', ring: 'ring-yellow-500' },
  [SystemStatus.BLACKOUT]: { text: 'text-red-300', bg: 'bg-red-800', ring: 'ring-red-600' },
  [SystemStatus.ALERT]: { text: 'text-red-300', bg: 'bg-red-700', ring: 'ring-red-500' },
};

export const START_SEQUENCE = [
  "Grid startup sequence initiated.",
  "Starting auxiliary systems at coal plant...",
  "Boiler ignition sequence started. Steam pressure rising.",
  "Turbine spinning up to synchronous speed...",
  "Main transformer energized.",
  "Energizing main transmission bus...",
  "Awaiting operator command to connect substations.",
  "Grid is online. Ready for load dispatch."
];

export const STOP_SEQUENCE = [
  "Controlled grid shutdown initiated.",
  "Ramping down plant output to minimum load.",
  "Disconnecting all substations from the grid.",
  "Opening main circuit breaker at plant.",
  "De-energizing transmission network.",
  "Spinning down turbine.",
  "Shutting down boiler and auxiliary systems.",
  "Grid is now OFFLINE."
];

export const EMERGENCY_STOP_SEQUENCE = [
  "!!! GRID BLACKOUT SEQUENCE ACTIVATED !!!",
  "[RELAY] High-priority trip signal sent to all breakers.",
  "Cascading substation disconnections detected...",
  "Plant emergency trip triggered by grid instability.",
  "Loss of main transmission bus.",
  "Complete grid blackout."
];
