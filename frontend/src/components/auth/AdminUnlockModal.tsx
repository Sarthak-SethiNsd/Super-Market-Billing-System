import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/authService';
import { useAuth } from '@/context/AuthContext';

interface AdminUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUnlockModal: React.FC<AdminUnlockModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { setAdminToken } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the administrator password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await authService.unlockAdmin(password);
      await setAdminToken(res.token);
      setPassword('');
      onClose();
      navigate('/admin');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed. Please check the administrator password.');
      } else {
        setError('Authentication failed. Server unreachable or invalid password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#334c41] bg-[#263B32] text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#1f3029] text-[#71836A] flex items-center justify-center border border-[#334c41]">
              <Lock className="w-4 h-4 text-[#71836A]" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Unlock Administrator Privileges</h3>
              <p className="text-xs text-[#d6e2dc]">Requires backend PBKDF2 verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close unlock administrator modal"
            className="text-[#d6e2dc] hover:text-white p-1 rounded hover:bg-[#1f3029] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#285943]"
            disabled={isLoading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Administrator Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password..."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 text-slate-900 placeholder:text-slate-400 pr-10"
                autoFocus
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide administrator password' : 'Show administrator password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Verified server-side against PBKDF2-HMAC-SHA256 (100k rounds) via Windows CNG.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isLoading}
              className="bg-[#285943] hover:bg-[#1e4433] focus:ring-[#285943] text-white gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Unlock Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
