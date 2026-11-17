import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/authService';

export const StaffLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isStaff, loginStaff } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Read return destination or default to /dashboard
  const locationState = location.state as { from?: { pathname?: string }; sessionExpired?: boolean } | undefined;
  const rawFrom = locationState?.from?.pathname;
  const destination = (rawFrom && rawFrom !== '/staff/login' && rawFrom !== '/login') ? rawFrom : '/dashboard';
  const isSessionExpired = locationState?.sessionExpired;

  // If already authenticated, redirect immediately
  useEffect(() => {
    if (isStaff) {
      navigate(destination, { replace: true });
    }
  }, [isStaff, navigate, destination]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Please enter the staff password.');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const res = await authService.loginStaff(password);
      await loginStaff(res.token);
      setPassword('');
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Authentication failed. Please check the staff password.');
      } else {
        setError('Authentication failed. Server unreachable or invalid password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-14rem)] flex items-center justify-center py-8 px-4">
      <div className="w-full max-w-md">
        <Card className="bg-white border-[#E5E4DC] shadow-md rounded-2xl overflow-hidden">
          {/* Card Header */}
          <div className="px-6 py-5 bg-[#263B32] text-white border-b border-[#334c41]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#1f3029] border border-[#334c41] flex items-center justify-center text-[#71836A]">
                  <Lock className="w-5 h-5 text-[#71836A]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Staff Mode Authentication</h2>
                  <p className="text-xs text-[#d6e2dc] mt-0.5">Management &amp; Operational Access</p>
                </div>
              </div>
              <Badge variant="staff" className="bg-[#1f3029] text-[#9cb5a8] border-[#334c41] text-[10px] font-semibold">
                Staff Only
              </Badge>
            </div>
          </div>

          <CardContent className="p-6 space-y-4">
            {/* Session Expired Banner if redirected due to expiry */}
            {isSessionExpired && !error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                <span>Your staff session has expired or is invalid. Please sign in again to continue.</span>
              </div>
            )}

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Instruction Callout */}
            <p className="text-xs text-[#777D76] leading-relaxed">
              Enter your staff credentials to access the operational dashboard, product management, inventory controls, and sales telemetry.
            </p>

            {/* Password Form */}
            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label htmlFor="staff-password-input" className="block text-xs font-bold text-[#303631]">
                  Staff Password
                </label>
                <div className="relative">
                  <input
                    id="staff-password-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter staff password..."
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-[#DCDAD0] focus:outline-none focus:ring-2 focus:ring-[#285943]/20 focus:border-[#285943] text-[#303631] placeholder:text-[#9BA09A] pr-10 bg-white"
                    autoFocus
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide staff password' : 'Show staff password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777D76] hover:text-[#303631] p-1 rounded focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-[#777D76] flex items-center gap-1 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#285943]" />
                  <span>Secured with cryptographic PBKDF2-HMAC-SHA256 verification.</span>
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                <Link
                  to="/"
                  className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-1 text-xs text-[#777D76] hover:text-[#303631] py-2 px-3 rounded hover:bg-[#F7F6F1] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to Customer Mode</span>
                </Link>

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  disabled={isLoading}
                  className="w-full sm:w-auto bg-[#285943] hover:bg-[#1e4433] text-white text-xs font-bold px-4 py-2 gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Staff</span>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
