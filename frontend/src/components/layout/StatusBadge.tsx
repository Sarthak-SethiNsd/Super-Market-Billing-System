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
      dot: 'bg-[#2E6F40]',
      ping: 'bg-[#2E6F40]',
      text: 'Connected',
      textColor: 'text-[#2E6F40]',
      bg: 'bg-[#EEF5F0] border-[#C2D9C8]',
      title: `Backend v${healthData?.version || '1.0.0'} UP`,
    },
    checking: {
      dot: 'bg-[#C87D20]',
      ping: 'bg-[#C87D20]',
      text: 'Checking',
      textColor: 'text-[#C87D20]',
      bg: 'bg-[#FAF3EA] border-[#F0DDC5]',
      title: 'Verifying C++ REST backend...',
    },
    disconnected: {
      dot: 'bg-[#A63A38]',
      ping: 'bg-[#A63A38]',
      text: 'Disconnected',
      textColor: 'text-[#A63A38]',
      bg: 'bg-[#F8EFEF] border-[#ECD1D0]',
      title: `Cannot reach backend at ${API_BASE_URL}`,
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 rounded text-xs font-medium border ${config.bg} ${config.textColor} transition-all shrink-0`}
      title={config.title}
    >
      <span className="relative flex h-2 w-2 shrink-0">
        {status === 'connected' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.ping}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      <span className="whitespace-nowrap">
        <span className="hidden sm:inline">Backend: </span>
        {config.text}
      </span>
      <button
        type="button"
        onClick={handleManualRefresh}
        className="ml-0.5 sm:ml-1 text-[#777D76] hover:text-[#303631] transition-colors focus:outline-none shrink-0"
        title="Re-check backend health"
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
};
