
import { useState, useEffect, useRef, useCallback } from 'react';
import { SystemStatus, GridMetrics, GridSettings, Substation, ComponentStatus, TransmissionLine } from '../types';
import {
  INITIAL_GRID_METRICS,
  INITIAL_GRID_SETTINGS,
  INITIAL_SUBSTATIONS,
  INITIAL_TRANSMISSION_LINES,
  GRID_PARAMS,
  SIMULATION_TICK_RATE,
  OPERATIONAL_LIMITS,
  START_SEQUENCE,
  STOP_SEQUENCE,
  EMERGENCY_STOP_SEQUENCE
} from '../constants';
import { VoltageRegulation } from '../utils/VoltageRegulator';

export const useGridSimulation = () => {
  const [status, setStatus] = useState<SystemStatus>(SystemStatus.OFFLINE);
  const [metrics, setMetrics] = useState<GridMetrics>(INITIAL_GRID_METRICS);
  const [displayedMetrics, setDisplayedMetrics] = useState<GridMetrics>(INITIAL_GRID_METRICS);
  const [settings, setSettings] = useState<GridSettings>(INITIAL_GRID_SETTINGS);
  const [substations, setSubstations] = useState<Substation[]>(INITIAL_SUBSTATIONS);
  const [lines, setLines] = useState<TransmissionLine[]>(INITIAL_TRANSMISSION_LINES);
  const [logs, setLogs] = useState<string[]>(['[GRID] Simulator initialized. Awaiting commands.']);

  // Fault states
  const [lineFault, setLineFault] = useState<number | null>(null); // line id
  const [substationFault, setSubstationFault] = useState<number | null>(null); // substation id
  const [loadSurge, setLoadSurge] = useState(false);
  
  const intervalRef = useRef<number | null>(null);
  const sequenceTimeoutRef = useRef<number | null>(null);
  const voltageRegulatorRef = useRef(new VoltageRegulation());

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prevLogs => [`[${timestamp}] ${message}`, ...prevLogs.slice(0, 199)]);
  }, []);

  const runSequence = useCallback((sequence: string[], finalStatus: SystemStatus, onComplete?: () => void) => {
    if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
    }
    let step = 0;
    const runNextStep = () => {
      if (step < sequence.length) {
        addLog(sequence[step]);
        step++;
        sequenceTimeoutRef.current = window.setTimeout(runNextStep, 1500);
      } else {
        sequenceTimeoutRef.current = null;
        setStatus(finalStatus);
        if (onComplete) onComplete();
      }
    };
    runNextStep();
  }, [addLog]);

  const emergencyShutdown = useCallback((reason?: string) => {
    setStatus(currentStatus => {
        if (currentStatus !== SystemStatus.OFFLINE && currentStatus !== SystemStatus.BLACKOUT) {
            if (reason) addLog(`[GRID] ${reason}`);
            
            if (sequenceTimeoutRef.current) clearTimeout(sequenceTimeoutRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = null;
            sequenceTimeoutRef.current = null;

            runSequence(EMERGENCY_STOP_SEQUENCE, SystemStatus.BLACKOUT, () => {
                setMetrics(INITIAL_GRID_METRICS);
                setSubstations(INITIAL_SUBSTATIONS);
                setLines(INITIAL_TRANSMISSION_LINES);
                voltageRegulatorRef.current.reset();
            });
            return SystemStatus.BLACKOUT;
        }
        return currentStatus;
    });
  }, [addLog, runSequence]);

  const resetFaults = useCallback(() => {
    if (lineFault) {
        setLines(prev => prev.map(l => l.id === lineFault ? {...l, status: ComponentStatus.OFFLINE} : l));
        addLog(`[GRID] Fault on Line ${lineFault} cleared. Line is offline.`);
    }
    if (substationFault) {
        setSubstations(prev => prev.map(s => s.id === substationFault ? {...s, status: ComponentStatus.OFFLINE} : s));
        setLines(prev => prev.map(l => l.to === substationFault ? {...l, status: ComponentStatus.OFFLINE} : l));
        addLog(`[SUB-${substationFault}] Fault cleared. Substation is offline.`);
    }
    
    setLineFault(null);
    setSubstationFault(null);
    setLoadSurge(false);
    addLog('[SYSTEM] All fault conditions cleared.');
  }, [lineFault, substationFault, addLog]);

  const start = useCallback(() => {
    setStatus(currentStatus => {
        if (currentStatus === SystemStatus.OFFLINE || currentStatus === SystemStatus.BLACKOUT) {
            resetFaults();
            setMetrics(INITIAL_GRID_METRICS);
            setSubstations(INITIAL_SUBSTATIONS);
            setLines(INITIAL_TRANSMISSION_LINES);
            voltageRegulatorRef.current.reset();
            runSequence(START_SEQUENCE, SystemStatus.STABLE);
            return SystemStatus.ENERGIZING;
        }
        return currentStatus;
    });
  }, [runSequence, resetFaults]);

  const stop = useCallback(() => {
    setStatus(currentStatus => {
        if (currentStatus === SystemStatus.STABLE || currentStatus === SystemStatus.ALERT) {
            runSequence(STOP_SEQUENCE, SystemStatus.OFFLINE, () => {
                setMetrics(INITIAL_GRID_METRICS);
                setSubstations(INITIAL_SUBSTATIONS);
                setLines(INITIAL_TRANSMISSION_LINES);
                voltageRegulatorRef.current.reset();
            });
            return SystemStatus.SHUTTING_DOWN;
        }
        return currentStatus;
    });
  }, [runSequence]);

  const updateSetting = useCallback((key: keyof GridSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const acknowledgeAlert = useCallback(() => {
    setStatus(currentStatus => {
        if (currentStatus === SystemStatus.ALERT) {
            addLog('[OPERATOR] Alert acknowledged.');
            return SystemStatus.STABLE;
        }
        return currentStatus;
    });
  }, [addLog]);

  const toggleSubstation = useCallback((id: number) => {
    setStatus(s => {
      if (s !== SystemStatus.STABLE && s !== SystemStatus.ALERT) return s;
      
      setSubstations(prev => prev.map(sub => {
        if (sub.id === id && sub.status !== ComponentStatus.FAULTED) {
          const newStatus = sub.status === ComponentStatus.ONLINE ? ComponentStatus.OFFLINE : ComponentStatus.ONLINE;
          addLog(`[SUB-0${id}] Breaker ${newStatus === ComponentStatus.ONLINE ? 'CLOSED' : 'OPENED'} by operator.`);
          return {...sub, status: newStatus};
        }
        return sub;
      }));
      setLines(prev => prev.map(line => {
        if (line.to === id && line.status !== ComponentStatus.FAULTED) {
          const newStatus = line.status === ComponentStatus.ONLINE ? ComponentStatus.OFFLINE : ComponentStatus.ONLINE;
          return {...line, status: newStatus};
        }
        return line;
      }));
      return s;
    });
  }, [addLog]);
  
  // New fault actions
  const triggerLineFault = useCallback((id: number) => {
    if(status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return;
    addLog(`[SCENARIO] Simulating transmission line fault on Line ${id}.`);
    setLineFault(id);
    setLines(prev => prev.map(l => l.id === id ? {...l, status: ComponentStatus.FAULTED} : l));
    setSubstations(prev => prev.map(s => s.id === id ? {...s, status: ComponentStatus.FAULTED} : s));
  }, [addLog, status]);

  const triggerSubstationFault = useCallback((id: number) => {
    if(status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return;
    addLog(`[SCENARIO] Simulating major transformer fault at Substation ${id}.`);
    setSubstationFault(id);
    setSubstations(prev => prev.map(s => s.id === id ? {...s, status: ComponentStatus.FAULTED} : s));
    setLines(prev => prev.map(l => l.to === id ? {...l, status: ComponentStatus.FAULTED} : l));
  }, [addLog, status]);
  
  const triggerLoadSurge = useCallback(() => {
    if(status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return;
    addLog(`[SCENARIO] Simulating sudden city-wide load surge.`);
    setLoadSurge(true);
    setTimeout(() => setLoadSurge(false), 20000); // Surge lasts 20 seconds
  }, [addLog, status]);


  useEffect(() => {
    const isSimRunning = status === SystemStatus.STABLE || status === SystemStatus.ALERT;

    if (isSimRunning && !intervalRef.current) {
      const tick = () => {
        const deltaTime = SIMULATION_TICK_RATE / 1000;
        
        // Update substation loads
        const updatedSubstations = substations.map(sub => {
            if (sub.status === ComponentStatus.ONLINE) {
                const baseLoad = 40 + (sub.id - 1) * 5;
                const newLoad = baseLoad + (Math.random() - 0.5) * 5;
                return {...sub, load: parseFloat(newLoad.toFixed(1))};
            }
            return {...sub, load: 0};
        });
        setSubstations(updatedSubstations);

        setMetrics(prev => {
          const lastFrequency = prev.gridFrequency;

          // 1. Calculate Total Demand
          const onlineSubstationLoad = updatedSubstations.reduce((acc, sub) => acc + sub.load, 0);
          let cityBaseLoad = 200 + Math.sin(Date.now() / 30000) * 20; // Slow daily-like variation
          if (loadSurge) cityBaseLoad *= 1.3; // 30% surge
          const totalDemand = onlineSubstationLoad + cityBaseLoad;

          // 2. Adjust Plant Output towards Dispatch
          let plantOutput = prev.plantOutput;
          const ramp = GRID_PARAMS.plant.rampRate * deltaTime;
          if (plantOutput < settings.plantDispatch) {
            plantOutput = Math.min(plantOutput + ramp, settings.plantDispatch);
          } else if (plantOutput > settings.plantDispatch) {
            plantOutput = Math.max(plantOutput - ramp, settings.plantDispatch);
          }
          plantOutput = Math.max(GRID_PARAMS.plant.min, Math.min(plantOutput, GRID_PARAMS.plant.max));

          // 3. Power Balance & Frequency Calculation (Swing Equation)
          const powerImbalance = plantOutput - totalDemand; // MW
          const acceleration = powerImbalance / (2 * GRID_PARAMS.inertia * GRID_PARAMS.plant.max) * (settings.targetFrequency); // Hz/s
          
          let gridFrequency = prev.gridFrequency + (acceleration * deltaTime);
          // Add damping
          gridFrequency -= (prev.gridFrequency - settings.targetFrequency) * 0.1 * deltaTime;
          gridFrequency = Math.max(55, Math.min(65, gridFrequency)); // Clamp frequency
          
          const rocf = (gridFrequency - lastFrequency) / deltaTime;

          // 4. Voltage Regulation
          const voltageSag = (totalDemand / (GRID_PARAMS.plant.max * 1.5)) * 0.1; // More load = more sag
          const naturalVoltage = settings.targetVoltage - voltageSag;
          const voltageCorrection = voltageRegulatorRef.current.regulateVoltage(prev.systemVoltage, naturalVoltage);
          const systemVoltage = prev.systemVoltage + voltageCorrection;

          // 5. Other metrics
          const tempIncrease = (plantOutput / GRID_PARAMS.plant.max) * 0.1;
          const temperature = Math.min(prev.temperature + tempIncrease - 0.08, OPERATIONAL_LIMITS.temperature + 10);
          
          const newMetrics: GridMetrics = {
              plantOutput: parseFloat(plantOutput.toFixed(1)),
              cityLoad: parseFloat(cityBaseLoad.toFixed(1)),
              totalDemand: parseFloat(totalDemand.toFixed(1)),
              gridFrequency: parseFloat(gridFrequency.toFixed(3)),
              systemVoltage: parseFloat(systemVoltage.toFixed(3)),
              temperature: parseFloat(temperature.toFixed(1)),
              rocf: parseFloat(rocf.toFixed(2)),
          };
          
          // --- Check Limits ---
          if (temperature > OPERATIONAL_LIMITS.temperature) {
             setStatus(currentStatus => currentStatus !== SystemStatus.ALERT ? SystemStatus.ALERT : currentStatus);
             addLog(`[ALERT] Plant temperature exceeds operational limits! Temp: ${temperature.toFixed(1)}°C`);
          }
          if (Math.abs(gridFrequency - settings.targetFrequency) > (settings.targetFrequency * OPERATIONAL_LIMITS.frequencyTolerance)) {
             setStatus(currentStatus => currentStatus !== SystemStatus.ALERT ? SystemStatus.ALERT : currentStatus);
             addLog(`[ALERT] Grid frequency out of tolerance! Freq: ${gridFrequency.toFixed(2)}Hz`);
          }
          if (rocf < OPERATIONAL_LIMITS.rocf) {
              emergencyShutdown(`GRID INSTABILITY - RoCoF at ${rocf.toFixed(2)} Hz/s exceeded critical limit.`);
          }
          
          return newMetrics;
        });
      };
      
      intervalRef.current = window.setInterval(tick, SIMULATION_TICK_RATE);
    } else if (!isSimRunning && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
    }
    
    return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, settings, substations, addLog, emergencyShutdown, loadSurge]);


  useEffect(() => {
    // When offline, ensure metrics are zeroed.
    if(status === SystemStatus.OFFLINE) {
        setMetrics(INITIAL_GRID_METRICS);
    }
  }, [status]);

  // For this HMI, we assume no comms loss, so displayed metrics are always real metrics.
  useEffect(() => {
      setDisplayedMetrics(metrics);
  }, [metrics]);

  const stableActions = {
      triggerLineFault,
      triggerSubstationFault,
      triggerLoadSurge,
      resetFaults
  };

  return { 
    status, 
    metrics: displayedMetrics, 
    settings, 
    logs, 
    substations,
    lines,
    start, 
    stop, 
    emergencyShutdown, 
    updateSetting, 
    acknowledgeAlert,
    toggleSubstation,
    faults: {
      lineFault,
      substationFault,
      loadSurge,
    },
    actions: stableActions
  };
};
