import React, { useState } from 'react';
import { useHealth } from '@/context/HealthContext';
import { RefreshCw } from 'lucide-react';
import { ConnectionModal } from './ConnectionModal';

export const StatusBadge: React.FC = () => {
  const { status, healthData, latencyMs, checkHealth } = useHealth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleManualRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRefreshing(true);
    await checkHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const config = {
    connected: {
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      text: latencyMs !== null ? `Online (${latencyMs}ms)` : 'Online',
      textColor: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100/70',
      title: `Server Online • v${healthData?.version || '1.0.0'} • Click to view connection details`,
    },
    checking: {
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
      text: 'Connecting...',
      textColor: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200 hover:bg-amber-100/70',
      title: 'Verifying POS backend connection...',
    },
    disconnected: {
      dot: 'bg-rose-500',
      ping: 'bg-rose-400',
      text: 'Server Offline',
      textColor: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200 hover:bg-rose-100/70 animate-pulse',
      title: 'Backend unreachable. Click to configure connection endpoint.',
    },
  }[status];

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.textColor} transition-all shadow-2xs cursor-pointer select-none`}
        title={config.title}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsModalOpen(true);
          }
        }}
      >
        <span className="relative flex h-2 w-2">
          {status === 'connected' && (
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
        </span>
        <span className="font-semibold">{config.text}</span>
        <button
          type="button"
          onClick={handleManualRefresh}
          className="ml-0.5 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none p-0.5"
          title="Re-check server connection"
          aria-label="Refresh connection status"
        >
          <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <ConnectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
