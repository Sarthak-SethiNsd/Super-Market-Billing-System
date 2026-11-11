import React from 'react';
import { useHealth } from '@/context/HealthContext';
import { RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '@/services/api';

export const StatusBadge: React.FC = () => {
  const { status, healthData, checkHealth } = useHealth();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await checkHealth();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const config = {
    connected: {
      dot: 'bg-emerald-500',
      ping: 'bg-emerald-400',
      text: 'Connected',
      textColor: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-200',
      title: `Backend v${healthData?.version || '1.0.0'} UP`,
    },
    checking: {
      dot: 'bg-amber-500',
      ping: 'bg-amber-400',
      text: 'Checking',
      textColor: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-200',
      title: 'Verifying C++ REST backend...',
    },
    disconnected: {
      dot: 'bg-rose-500',
      ping: 'bg-rose-400',
      text: 'Disconnected',
      textColor: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200',
      title: `Cannot reach backend at ${API_BASE_URL}`,
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.textColor} transition-all shadow-sm`}
      title={config.title}
    >
      <span className="relative flex h-2 w-2">
        {status === 'connected' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span>Backend: {config.text}</span>
      <button
        onClick={handleManualRefresh}
        className="ml-1 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
        title="Re-check backend health"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
