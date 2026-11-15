import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { BrandManager } from '@/components/admin/BrandManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';
import { ConnectionModal } from '@/components/layout/ConnectionModal';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  LogOut,
  CheckCircle2,
  Server,
  Settings,
  Wifi
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isAdmin, username, clearAdminSession } = useAuth();
  const { status, latencyMs, apiUrl } = useHealth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Store Administration & Master Data
          </h2>
          <p className="text-xs text-slate-500">
            Store master catalog categories, brands, terminal server settings, and manager security access.
          </p>
        </div>

        <Badge variant={isAdmin ? 'admin' : 'staff'} className="py-1 px-3 gap-1.5 text-xs">
          {isAdmin ? <Unlock className="w-3.5 h-3.5 text-purple-600" /> : <Lock className="w-3.5 h-3.5 text-blue-600" />}
          {isAdmin ? 'STORE MANAGER PRIVILEGES ACTIVE' : 'CASHIER ACCESS MODE'}
        </Badge>
      </div>

      {/* Admin Status Card */}
      <Card className={isAdmin ? 'border-purple-200 bg-purple-50/20' : 'border-slate-200'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-purple-600" /> : <ShieldAlert className="w-5 h-5 text-slate-500" />}
              Manager Authorization Status
            </CardTitle>
            <span className="text-xs font-mono text-slate-500">
              {isAdmin ? `Session: ${username || 'admin'}` : 'Locked (Cashier Mode)'}
            </span>
          </div>
          <CardDescription className="text-xs">
            {isAdmin
              ? 'You have active store manager privileges. Privileged operations (adding products, modifying categories/brands, inventory adjustments) are unlocked.'
              : 'The terminal is operating under Cashier mode. Store management operations require manager password verification.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-purple-700">
                <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Encrypted manager session token verified by store backend engine.</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAdminSession}
                className="text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200 gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Lock Manager Session
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center text-slate-600">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">Unlock Store Manager Mode</h4>
                  <p className="text-xs text-slate-500">
                    Enter the master administrator password to create and edit products, manage brands & categories, and adjust stock.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUnlockModal(true)}
                className="gap-1.5 shrink-0 bg-purple-600 hover:bg-purple-700 text-white font-bold"
              >
                <Unlock className="w-3.5 h-3.5" />
                Manager Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Terminal & Network Settings Card */}
      <Card className="border-slate-200">
        <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              status === 'connected' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-slate-900">POS Terminal Server Settings</h4>
                <Badge variant={status === 'connected' ? 'success' : 'danger'} className="text-[10px] font-mono">
                  {status === 'connected' ? `ONLINE (${latencyMs ?? 0}ms)` : 'OFFLINE'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Active API endpoint: <code className="font-mono text-slate-700">{apiUrl}</code>
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConnectionModal(true)}
            className="text-xs shrink-0 gap-1.5"
          >
            <Wifi className="w-3.5 h-3.5" />
            Configure Server URL
          </Button>
        </CardContent>
      </Card>

      {/* Brand & Category Managers Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BrandManager />
        <CategoryManager />
      </div>

      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />

      <ConnectionModal
        isOpen={showConnectionModal}
        onClose={() => setShowConnectionModal(false)}
      />
    </div>
  );
};
