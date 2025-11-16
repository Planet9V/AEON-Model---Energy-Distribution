
export enum SystemStatus {
  OFFLINE = 'OFFLINE',
  ENERGIZING = 'ENERGIZING',
  STABLE = 'STABLE',
  SHUTTING_DOWN = 'SHUTTING_DOWN',
  BLACKOUT = 'BLACKOUT',
  ALERT = 'ALERT',
}

export enum ComponentStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  FAULTED = 'FAULTED',
}

export interface Substation {
  id: number;
  name: string;
  status: ComponentStatus;
  load: number; // in MW
  voltage: number; // in kV
}

export interface TransmissionLine {
  id: number;
  from: string;
  to: number;
  status: ComponentStatus;
}

export interface GridMetrics {
  plantOutput: number; // MW
  cityLoad: number; // MW
  totalDemand: number; // MW (cityLoad + substation loads)
  gridFrequency: number; // Hz
  systemVoltage: number; // Per Unit
  temperature: number; // Plant Temperature
  rocf: number;
}

export interface GridSettings {
  plantDispatch: number; // Target MW
  targetVoltage: number; // p.u.
  targetFrequency: number; // Hz
}
