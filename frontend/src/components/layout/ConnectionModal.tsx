import React, { useState } from 'react';
import { useHealth } from '@/context/HealthContext';
import { Button } from '@/components/ui/Button';
import {
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Wifi,
  WifiOff,
  Radio
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({ isOpen, onClose }) => {
  const {
    status,
    healthData,
    latencyMs,
    errorMessage,
    apiUrl,
    lastChecked,
    updateUrl,
    resetUrl
  } = useHealth();

  const [inputUrl, setInputUrl] = useState(apiUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;

    setIsSaving(true);
    setSaveFeedback(null);
    const success = await updateUrl(inputUrl);
    setIsSaving(false);

    if (success) {
      setSaveFeedback('Connected successfully to POS server!');
      setTimeout(() => setSaveFeedback(null), 3000);
    } else {
      setSaveFeedback('Could not connect to the specified URL.');
    }
  };

  const handleReset = async () => {
    setIsSaving(true);
    setSaveFeedback(null);
    await resetUrl();
    setInputUrl('http://localhost:8080');
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-connection-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              status === 'connected' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}>
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-connection-title" className="text-base font-bold text-slate-900 leading-tight">
                Store Server Connection
              </h3>
              <p className="text-xs text-slate-500">
                POS Terminal & REST Backend Diagnostics
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            status === 'connected'
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : status === 'checking'
              ? 'bg-amber-50/70 border-amber-200 text-amber-900'
              : 'bg-rose-50/70 border-rose-200 text-rose-900'
          }`}>
            <div className="mt-0.5 shrink-0">
              {status === 'connected' ? (
                <Wifi className="w-5 h-5 text-emerald-600" />
              ) : status === 'checking' ? (
                <Radio className="w-5 h-5 text-amber-600 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-600" />
              )}
            </div>
            <div className="flex-1 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {status === 'connected'
                    ? 'Server Online & Operational'
                    : status === 'checking'
                    ? 'Verifying Server Reachability...'
                    : 'Server Disconnected'}
                </span>
                {latencyMs !== null && (
                  <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                    {latencyMs} ms
                  </span>
                )}
              </div>
              <p className="text-slate-600 leading-relaxed">
                {status === 'connected'
                  ? `Connected to ${healthData?.service || 'Supermarket Management API'} (v${healthData?.version || '1.0.0'}). Transactions and stock sync are live.`
                  : errorMessage || `Cannot reach server at ${apiUrl}. Please verify the backend process is running.`}
              </p>
              {lastChecked && (
                <p className="text-[10px] text-slate-400 pt-1">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* Endpoint Configuration Form */}
          <form onSubmit={handleTestAndSave} className="space-y-4">
            <div>
              <label htmlFor="server-url-input" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Backend API Server Base URL
              </label>
              <div className="flex gap-2">
                <input
                  id="server-url-input"
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                  className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs px-3"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Test & Connect
                </Button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">
                For in-store multi-terminal setups or cloud deployments, enter the central server URL (e.g., <code className="font-mono text-slate-700">http://192.168.1.100:8080</code> or your cloud API domain).
              </p>
            </div>

            {saveFeedback && (
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                status === 'connected' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                {status === 'connected' ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                <span>{saveFeedback}</span>
              </div>
            )}
          </form>

          {/* Quick Troubleshooting Info */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
            <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
              Connection Checklist
            </span>
            <ul className="list-disc pl-4 space-y-1 text-[11px] text-slate-500">
              <li>Ensure the C++ backend is running (<code className="font-mono text-slate-700">.\start-app.ps1</code> or <code className="font-mono text-slate-700">supermarket_server.exe</code>).</li>
              <li>Default local port is <code className="font-mono text-slate-700">8080</code>.</li>
              <li>CORS is enabled for all origins on the backend engine.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={handleReset}
            disabled={isSaving}
            className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
          >
            Reset to Default (localhost:8080)
          </button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
