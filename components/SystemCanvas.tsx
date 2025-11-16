
import React from 'react';
import { GridMetrics, SystemStatus, Substation, ComponentStatus, TransmissionLine } from '../types';
import { STATUS_STYLES } from '../constants';
import { MetricsDisplay } from './MetricsDisplay';
import { CoalIcon, UsersIcon, ZapIcon, AlertTriangleIcon } from './icons';

interface SystemCanvasProps {
  status: SystemStatus;
  metrics: GridMetrics;
  substations: Substation[];
  lines: TransmissionLine[];
}

const getLineColor = (status: ComponentStatus) => {
    switch(status) {
        case ComponentStatus.ONLINE: return '#FBBF24'; // yellow
        case ComponentStatus.FAULTED: return '#F87171'; // red
        default: return '#4B5563'; // gray
    }
}

const getSubstationColor = (status: ComponentStatus) => {
    switch(status) {
        case ComponentStatus.ONLINE: return '#22C55E'; // green
        case ComponentStatus.FAULTED: return '#EF4444'; // red
        default: return '#6B7280'; // gray
    }
}

export const SystemCanvas: React.FC<SystemCanvasProps> = ({ status, metrics, substations, lines }) => {
    const isEnergized = status === SystemStatus.STABLE || status === SystemStatus.ALERT || status === SystemStatus.ENERGIZING;

    const lineCoords = [
        { x1: 200, y1: 100, x2: 300, y2: 50 },
        { x1: 200, y1: 100, x2: 300, y2: 150 },
        { x1: 200, y1: 100, x2: 300, y2: 250 },
        { x1: 200, y1: 200, x2: 400, y2: 200 },
        { x1: 200, y1: 300, x2: 300, y2: 150 },
        { x1: 200, y1: 300, x2: 300, y2: 250 },
        { x1: 200, y1: 300, x2: 300, y2: 350 },
    ];
    
    const subCoords = [
        { x: 300, y: 50 }, { x: 300, y: 150 }, { x: 300, y: 250 },
        { x: 400, y: 200 },
        { x: 300, y: 150 }, { x: 300, y: 250 }, { x: 300, y: 350 }
    ];

    const distributionLineCoords = [
        { x1: 320, y1: 50, x2: 600, y2: 200 },
        { x1: 320, y1: 150, x2: 600, y2: 200 },
        { x1: 320, y1: 250, x2: 600, y2: 200 },
        { x1: 420, y1: 200, x2: 600, y2: 200 },
        { x1: 320, y1: 150, x2: 600, y2: 200 },
        { x1: 320, y1: 250, x2: 600, y2: 200 },
        { x1: 320, y1: 350, x2: 600, y2: 200 },
    ];


  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet">
        {/* Background */}
        <rect x="0" y="0" width="800" height="400" fill="#111827" />
        
        {/* Power Plant */}
        <g id="PowerPlant">
            <rect x="20" y="150" width="100" height="100" fill="#1F2937" stroke="#374151" strokeWidth="2" rx="5" />
            <CoalIcon x="45" y="160" width="50" height="50" className={isEnergized ? "text-yellow-400" : "text-gray-500"} />
            <text x="70" y="235" textAnchor="middle" fill="#9CA3AF" fontSize="12" fontWeight="bold">COAL PLANT</text>
        </g>

        {/* Main Transmission Bus */}
        <line x1="120" y1="200" x2="200" y2="200" stroke={isEnergized ? getLineColor(ComponentStatus.ONLINE) : getLineColor(ComponentStatus.OFFLINE)} strokeWidth="4" />
        {isEnergized && <circle cx="160" cy="200" r="5" fill={getLineColor(ComponentStatus.ONLINE)} className="electricity-flow" />}
        <rect x="200" y="80" width="8" height="240" fill={isEnergized ? getLineColor(ComponentStatus.ONLINE) : getLineColor(ComponentStatus.OFFLINE)} />

        {/* Transmission Lines */}
        {lines.map((line, i) => {
            const coords = lineCoords[i];
            const isOnline = line.status === ComponentStatus.ONLINE;
            return (
                <g key={`line-${line.id}`}>
                    <line {...coords} stroke={getLineColor(line.status)} strokeWidth="2" />
                    {isOnline && <circle cx={coords.x1 + (coords.x2 - coords.x1)/2} cy={coords.y1 + (coords.y2-coords.y1)/2} r="5" fill={getLineColor(line.status)} className="electricity-flow" />}
                </g>
            );
        })}

        {/* Substations */}
        {substations.map((sub, i) => {
            const coords = subCoords[i];
            const color = getSubstationColor(sub.status);
            return (
                <g key={`sub-${sub.id}`}>
                    <rect x={coords.x} y={coords.y - 10} width="20" height="20" fill={color} stroke="#111827" strokeWidth="1" />
                    <text x={coords.x + 10} y={coords.y + 20} textAnchor="middle" fill="#9CA3AF" fontSize="8">{sub.name}</text>
                    {sub.status === 'FAULTED' && <AlertTriangleIcon x={coords.x+2} y={coords.y-8} width="16" height="16" className="text-yellow-300" />}
                </g>
            );
        })}

         {/* Distribution Lines */}
        {substations.map((sub, i) => {
            const coords = distributionLineCoords[i];
             const isOnline = sub.status === ComponentStatus.ONLINE;
            return (
                 <g key={`dist-line-${sub.id}`}>
                    <line {...coords} stroke={getLineColor(sub.status)} strokeWidth="1" strokeDasharray="2 2" />
                     {isOnline && <circle cx={coords.x1 + (coords.x2 - coords.x1)/2} cy={coords.y1 + (coords.y2-coords.y1)/2} r="3" fill={getLineColor(sub.status)} className="electricity-flow-dist" />}
                </g>
            );
        })}


        {/* City Load */}
        <g id="CityLoad">
            <UsersIcon x="650" y="175" width="100" height="100" className={isEnergized ? "text-cyan-400" : "text-gray-600"} />
            <text x="700" y="165" textAnchor="middle" fill="#9CA3AF" fontSize="14" fontWeight="bold">CITY</text>
        </g>

      </svg>
      <MetricsDisplay metrics={metrics} status={status} />
      <style>{`
        @keyframes electricity-pulse {
          0% { r: 5; opacity: 1; }
          100% { r: 15; opacity: 0; }
        }
         @keyframes electricity-pulse-dist {
          0% { r: 3; opacity: 1; }
          100% { r: 10; opacity: 0; }
        }
        .electricity-flow {
          animation: electricity-pulse 1.5s linear infinite;
        }
        .electricity-flow-dist {
           animation: electricity-pulse-dist 2s linear infinite;
        }
      `}</style>
    </div>
  );
};
