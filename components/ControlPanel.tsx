
import React from 'react';
import { SystemStatus, GridSettings, Substation } from '../types';
import { GRID_PARAMS } from '../constants';
import { PlayIcon, StopIcon, AlertTriangleIcon } from './icons';
import { Dial } from './Dial';

interface ControlPanelProps {
  status: SystemStatus;
  settings: GridSettings;
  substations: Substation[];
  onStart: () => void;
  onStop: () => void;
  onEmergencyShutdown: () => void;
  onSettingChange: (key: keyof GridSettings, value: number) => void;
  onToggleSubstation: (id: number) => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  settings,
  substations,
  onStart,
  onStop,
  onEmergencyShutdown,
  onSettingChange,
  onToggleSubstation
}) => {
  const isStoppable = status === SystemStatus.STABLE || status === SystemStatus.ALERT;
  const isOffline = status === SystemStatus.OFFLINE || status === SystemStatus.BLACKOUT;
  const isEmergencyStoppable = !isOffline;
  const areDialsDisabled = !isStoppable;

  return (
    <div className="flex h-full p-2 space-x-4">
      {/* Left Panel: Operations */}
      <div className="flex flex-col w-1/4 items-center justify-around py-2 bg-gray-900/50 rounded-lg border border-gray-700">
        <h3 className="text-lg font-bold uppercase text-gray-400 tracking-wider">Grid Operations</h3>
        
        <div className="flex flex-col space-y-4">
          <button
            onClick={onStart}
            disabled={!isOffline}
            className="w-40 h-16 font-bold uppercase rounded-md shadow-lg border-b-4 border-green-800 bg-green-600 text-white flex items-center justify-center space-x-2 transition-all duration-150 hover:bg-green-500 disabled:bg-gray-700 disabled:border-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed active:translate-y-0.5 active:border-b-2"
          >
            <PlayIcon className="w-7 h-7" />
            <span className="text-lg">Energize</span>
          </button>
          
          <button
            onClick={onStop}
            disabled={!isStoppable}
            className="w-40 h-16 font-bold uppercase rounded-md shadow-lg border-b-4 border-yellow-700 bg-yellow-500 text-gray-900 flex items-center justify-center space-x-2 transition-all duration-150 hover:bg-yellow-400 disabled:bg-gray-700 disabled:border-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed active:translate-y-0.5 active:border-b-2"
          >
            <StopIcon className="w-7 h-7" />
            <span className="text-lg">Shutdown</span>
          </button>
        </div>
        
        <button
            onClick={() => onEmergencyShutdown()}
            disabled={!isEmergencyStoppable}
            className="w-28 h-28 rounded-full bg-red-700 text-white flex flex-col items-center justify-center shadow-xl border-4 border-red-900 hover:bg-red-600 disabled:bg-gray-700 disabled:border-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-all duration-150 active:shadow-inner disabled:animate-none animate-pulse"
          >
            <AlertTriangleIcon className="w-7 h-7" />
            <span className="font-bold text-lg uppercase mt-1">Blackout</span>
        </button>
      </div>
      
      {/* Center Panel: Plant Controls */}
      <div className="flex-grow w-1/4 flex flex-col items-center justify-center bg-gray-900/50 rounded-lg p-2 border border-gray-700 space-y-2">
          <h3 className="text-lg font-bold uppercase text-gray-400 tracking-wider mb-2">Power Plant Control</h3>
          <div className="flex space-x-8">
            <Dial
              label="Plant Dispatch"
              value={settings.plantDispatch}
              min={GRID_PARAMS.plant.min}
              max={GRID_PARAMS.plant.max}
              step={10}
              unit={GRID_PARAMS.plant.unit}
              onChange={(value) => onSettingChange('plantDispatch', value)}
              disabled={areDialsDisabled}
            />
             <Dial
              label="System Voltage"
              value={settings.targetVoltage}
              min={GRID_PARAMS.voltage.min}
              max={GRID_PARAMS.voltage.max}
              step={0.01}
              unit={GRID_PARAMS.voltage.unit}
              onChange={(value) => onSettingChange('targetVoltage', value)}
              disabled={areDialsDisabled}
              precision={2}
            />
          </div>
      </div>
      
      {/* Right Panel: Substation Breakers */}
      <div className="flex-grow w-1/2 flex flex-col items-center bg-gray-900/50 rounded-lg p-2 border border-gray-700">
          <h3 className="text-lg font-bold uppercase text-gray-400 tracking-wider mb-2">Substation Breakers</h3>
          <div className="grid grid-cols-4 grid-rows-2 gap-2 w-full h-full p-2">
            {substations.map(sub => (
                <button
                    key={sub.id}
                    onClick={() => onToggleSubstation(sub.id)}
                    disabled={!isStoppable || sub.status === 'FAULTED'}
                    className={`p-2 font-bold rounded-md shadow-md text-sm transition-all duration-150 border-b-4
                        ${sub.status === 'ONLINE' ? 'bg-green-600 border-green-800 hover:bg-green-500 text-white' : ''}
                        ${sub.status === 'OFFLINE' ? 'bg-gray-600 border-gray-800 hover:bg-gray-500 text-gray-200' : ''}
                        ${sub.status === 'FAULTED' ? 'bg-red-800 border-red-900 text-red-200 animate-pulse' : ''}
                        disabled:bg-gray-700 disabled:border-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed
                    `}
                >
                    <div>{sub.name}</div>
                    <div className="text-xs font-normal">{sub.status}</div>
                </button>
            ))}
             <div className="flex items-center justify-center text-gray-500 text-sm">GRID</div>
          </div>
      </div>
    </div>
  );
};
