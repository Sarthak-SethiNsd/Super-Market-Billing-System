import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { BrandManager } from '@/components/admin/BrandManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';
import { ShieldAlert, ShieldCheck, Key, Lock, Unlock, LogOut, CheckCircle2 } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isAdmin, username, clearAdminSession } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#303631] tracking-tight">Administrative Control Center</h2>
          <p className="text-xs text-[#777D76]">
            Security settings, brand/category catalog management, and role-based permissions.
          </p>
        </div>

        <Badge variant={isAdmin ? 'admin' : 'staff'} className="py-1 px-3 gap-1.5">
          {isAdmin ? <Unlock className="w-3.5 h-3.5 text-[#285943]" /> : <Lock className="w-3.5 h-3.5 text-[#71836A]" />}
          {isAdmin ? 'ADMINISTRATOR PRIVILEGES ACTIVE' : 'STAFF ACCESS MODE'}
        </Badge>
      </div>

      {/* Admin Status Card */}
      <Card className={isAdmin ? 'border-[#C2D9C8] bg-[#EEF5F0]/30' : 'border-[#E5E4DC]'}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-[#285943]" /> : <ShieldAlert className="w-5 h-5 text-[#777D76]" />}
              Current Session Security Status
            </CardTitle>
            <span className="text-xs font-mono text-[#777D76]">
              {isAdmin ? `Authenticated: ${username || 'admin'}` : 'Unauthenticated (Staff)'}
            </span>
          </div>
          <CardDescription>
            {isAdmin
              ? 'You have active administrative privileges. Bearer token is automatically attached to privileged API calls.'
              : 'The terminal is operating under Staff mode. Privileged operations (adding products, modifying categories, inventory adjustments) require unlocking.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#285943]">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0" />
                <span>Backend verified bearer token active via PBKDF2-HMAC-SHA256</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAdminSession}
                className="text-xs text-[#A63A38] hover:bg-[#F8EFEF] hover:border-[#ECD1D0] gap-1.5 shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                Revoke Admin Session
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-white border border-[#E5E4DC] flex items-center justify-center text-[#777D76]">
                  <Key className="w-4 h-4 text-[#285943]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#303631]">Unlock Administrative Privileges</h4>
                  <p className="text-xs text-[#777D76]">
                    Enter the master administrator password to enable brand, category, product CRUD, and inventory adjustments.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUnlockModal(true)}
                className="gap-1.5 shrink-0"
              >
                <Unlock className="w-3.5 h-3.5" />
                Unlock Admin Mode
              </Button>
            </div>
          )}
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
    </div>
  );
};
