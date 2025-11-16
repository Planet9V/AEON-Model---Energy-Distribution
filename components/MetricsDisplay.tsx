
import React from 'react';
import { GridMetrics, SystemStatus } from '../types';
import { STATUS_STYLES, GRID_PARAMS, OPERATIONAL_LIMITS } from '../constants';
import { ZapIcon, ThermometerIcon, ZapOffIcon, WavesIcon, GaugeIcon, ActivityIcon, UsersIcon } from './icons';

interface MetricDisplayProps {
  metrics: GridMetrics;
  status: SystemStatus;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  className?: string;
  valueClassName?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, label, value, unit, className, valueClassName }) => {
  const statusColor = STATUS_STYLES[SystemStatus.STABLE].text;

  return (
    <div className={`absolute bg-gray-900/60 backdrop-blur-sm p-2 rounded-lg border border-gray-700/50 shadow-lg ${className}`}>
      <div className="flex items-center space-x-2 text-gray-400">
        {icon}
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className={`text-lg font-bold mt-1 ${valueClassName || statusColor} flex items-baseline`}>
        {value}
        <span className="text-xs text-gray-400 ml-1">{unit}</span>
      </p>
    </div>
  );
};

export const MetricsDisplay: React.FC<MetricDisplayProps> = ({ metrics, status }) => {
  const getTempColor = (temp: number) => {
    if (status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return 'text-gray-400';
    if (temp > OPERATIONAL_LIMITS.temperature) return 'text-red-500 animate-pulse';
    if (temp > OPERATIONAL_LIMITS.temperature * 0.9) return 'text-yellow-400';
    return STATUS_STYLES[SystemStatus.STABLE].text;
  };

  const getRocfColor = (rocf: number) => {
    if (status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return 'text-gray-400';
    if (rocf < OPERATIONAL_LIMITS.rocf) return 'text-red-500 animate-pulse';
    if (rocf < OPERATIONAL_LIMITS.rocf * 0.75) return 'text-yellow-400';
    return STATUS_STYLES[SystemStatus.STABLE].text;
  };
  
  const getFrequencyColor = (freq: number) => {
     if (status !== SystemStatus.STABLE && status !== SystemStatus.ALERT) return 'text-gray-400';
    if (Math.abs(freq - 60) > 60 * OPERATIONAL_LIMITS.frequencyTolerance) return 'text-red-500';
    if (Math.abs(freq - 60) > 60 * OPERATIONAL_LIMITS.frequencyTolerance * 0.75) return 'text-yellow-400';
    return STATUS_STYLES[SystemStatus.STABLE].text;
  }

  const isStable = status === SystemStatus.STABLE || status === SystemStatus.ALERT;

  return (
    <>
      {/* Plant Metrics */}
      <MetricCard 
        icon={<ZapIcon className="w-4 h-4" />}
        label="Plant Output"
        value={metrics.plantOutput.toFixed(1)}
        unit={GRID_PARAMS.plant.unit}
        className="top-[10%] left-[2%]"
        valueClassName={isStable ? 'text-green-400' : 'text-gray-400'}
      />
      <MetricCard 
        icon={<ThermometerIcon className="w-4 h-4" />}
        label="Plant Temp"
        value={metrics.temperature.toFixed(1)}
        unit="°C"
        className="top-[25%] left-[2%]"
        valueClassName={getTempColor(metrics.temperature)}
      />

      {/* City/Load Metrics */}
      <MetricCard 
        icon={<UsersIcon className="w-4 h-4" />}
        label="City Load"
        value={metrics.cityLoad.toFixed(1)}
        unit="MW"
        className="top-[10%] right-[2%]"
        valueClassName={isStable ? STATUS_STYLES.STABLE.text : 'text-gray-400'}
      />
       <MetricCard 
        icon={<GaugeIcon className="w-4 h-4" />}
        label="Total Demand"
        value={metrics.totalDemand.toFixed(1)}
        unit="MW"
        className="top-[25%] right-[2%]"
        valueClassName={isStable ? STATUS_STYLES.STABLE.text : 'text-gray-400'}
      />


      {/* Grid-wide Metrics */}
      <MetricCard 
        icon={<WavesIcon className="w-4 h-4" />}
        label="Grid Frequency"
        value={metrics.gridFrequency.toFixed(2)}
        unit={GRID_PARAMS.frequency.unit}
        className="bottom-[2%] left-[25%]"
        valueClassName={getFrequencyColor(metrics.gridFrequency)}
      />
      <MetricCard 
        icon={<ZapOffIcon className="w-4 h-4" />}
        label="System Voltage"
        value={metrics.systemVoltage.toFixed(3)}
        unit={GRID_PARAMS.voltage.unit}
        className="bottom-[2%] left-[45%]"
        valueClassName={isStable ? STATUS_STYLES.STABLE.text : 'text-gray-400'}
      />
      <MetricCard 
        icon={<ActivityIcon className="w-4 h-4" />}
        label="RoCoF"
        value={metrics.rocf.toFixed(2)}
        unit="Hz/s"
        className="bottom-[2%] left-[65%]"
        valueClassName={getRocfColor(metrics.rocf)}
      />
    </>
  );
};
