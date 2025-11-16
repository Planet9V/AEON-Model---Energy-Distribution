
import React, { useRef, useEffect } from 'react';

interface LogPanelProps {
  logs: string[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  const getLogColor = (log: string) => {
    if (log.includes('!!!') || log.includes('[ALERT]') || log.includes('GRID INSTABILITY') || log.includes('BLACKOUT')) return 'text-red-400 font-bold';
    if (log.includes('[SCENARIO]')) return 'text-purple-400 font-bold';
    if (log.includes('STABLE')) return 'text-green-400';
    if (log.includes('OFFLINE')) return 'text-yellow-400';
    if (log.includes('[GRID]') || log.includes('[SYSTEM]')) return 'text-cyan-400';
    if (log.includes('[SUB-')) return 'text-indigo-400';
    if (log.includes('[PLANT]')) return 'text-orange-400';
    if (log.includes('[OPERATOR]')) return 'text-pink-400';
    return 'text-gray-300';
  };

  return (
    <div className="h-full flex flex-col p-2">
      <div ref={logContainerRef} className="flex-grow overflow-y-auto pr-2 h-full">
        {logs.map((log, index) => (
          <p key={index} className={`text-xs whitespace-pre-wrap leading-relaxed ${getLogColor(log)}`}>
            {log}
          </p>
        ))}
      </div>
    </div>
  );
};
