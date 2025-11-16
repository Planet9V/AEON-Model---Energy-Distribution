
import React from 'react';
import { SystemStatus } from '../types';
import { AlertTriangleIcon, RefreshCwIcon, ZapOffIcon, UsersIcon } from './icons';

interface FaultPanelProps {
  status: SystemStatus;
  faults: {
    lineFault: number | null;
    substationFault: number | null;
    loadSurge: boolean;
  };
  actions: {
    triggerLineFault: (id: number) => void;
    triggerSubstationFault: (id: number) => void;
    triggerLoadSurge: () => void;
    resetFaults: () => void;
  };
}

export const FaultPanel: React.FC<FaultPanelProps> = ({ status, faults, actions }) => {
  const isStable = status === SystemStatus.STABLE || status === SystemStatus.ALERT;
  const isAnyFaultActive = faults.lineFault !== null || faults.substationFault !== null || faults.loadSurge;
  
  const lineFaultId = 4;
  const subFaultId = 2;

  return (
    <div className="flex flex-col h-full space-y-4 p-4">
      <h3 className="text-lg font-bold text-center text-gray-300 border-b-2 border-gray-700 pb-2">Grid Scenario Injection</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-grow items-center">
        <button
          onClick={() => actions.triggerLineFault(lineFaultId)}
          disabled={!isStable || faults.lineFault === lineFaultId}
          className="flex flex-col items-center justify-center space-y-1 h-24 px-4 py-2 bg-purple-600 text-white font-semibold rounded-md hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          <AlertTriangleIcon className="w-8 h-8" />
          <span className="text-center text-sm">Line Fault (L-{lineFaultId})</span>
        </button>
        <button
          onClick={() => actions.triggerSubstationFault(subFaultId)}
          disabled={!isStable || faults.substationFault === subFaultId}
          className={`flex flex-col items-center justify-center space-y-1 h-24 px-4 py-2 text-white font-semibold rounded-md transition-colors bg-orange-600 hover:bg-orange-500 disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <ZapOffIcon className="w-8 h-8" />
          <span className="text-center text-sm">
            Substation Fault (S-{subFaultId})
          </span>
        </button>
        <button
          onClick={actions.triggerLoadSurge}
          disabled={!isStable || faults.loadSurge}
          className={`flex flex-col items-center justify-center space-y-1 h-24 px-4 py-2 text-white font-semibold rounded-md transition-colors bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed`}
        >
          <UsersIcon className="w-8 h-8" />
          <span className="text-center text-sm">
            Sudden Load Surge
          </span>
        </button>
         <button
          onClick={actions.resetFaults}
          disabled={!isAnyFaultActive}
          className="flex flex-col items-center justify-center space-y-1 h-24 px-4 py-2 bg-gray-500 text-white font-semibold rounded-md hover:bg-gray-400 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCwIcon className="w-8 h-8" />
          <span className="text-center text-sm">Reset Scenarios</span>
        </button>
      </div>
    </div>
  );
};
