import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { BrandManager } from '@/components/admin/BrandManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';
import {
  ShieldAlert,
  ShieldCheck,
  Key,
  Lock,
  Unlock,
  LogOut,
  CheckCircle2,
  Package,
  Boxes,
  BarChart3,
  Receipt,
  UserCheck,
  ArrowRight,
  Layers,
  Tag,
  Shield
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isAdmin, username, clearAdminSession } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'brands' | 'categories' | 'security'>('hub');

  const adminModules = [
    {
      id: 'products',
      name: 'Product Management',
      path: '/products',
      icon: Package,
      badge: 'Catalog Control',
      desc: 'Add, edit, or archive products, manage product codes, configure unit prices, and assign discount strategies.',
    },
    {
      id: 'inventory',
      name: 'Inventory Management',
      path: '/inventory',
      icon: Boxes,
      badge: 'Stock Auditing',
      desc: 'Live stock monitoring, low-stock threshold warnings, and manual inventory adjustments with audit trail.',
    },
    {
      id: 'analytics',
      name: 'Sales Analytics',
      path: '/analytics',
      icon: BarChart3,
      badge: 'Financial Reports',
      desc: 'Gross revenue trends, top-performing product rankings, and category sales distributions.',
    },
    {
      id: 'staff',
      name: 'Staff Management',
      path: '#staff-security',
      action: () => setActiveTab('security'),
      icon: UserCheck,
      badge: 'Access & Roles',
      desc: 'Manage administrative credentials, review session tokens, and configure brand and category permissions.',
    },
    {
      id: 'transactions',
      name: 'Transactions & Sales History',
      path: '/transactions',
      icon: Receipt,
      badge: 'Invoice Records',
      desc: 'Immutable historical sales invoices, price snapshots, payment verification, and thermal receipt reprints.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Mode Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#303631] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-[#285943]" />
            <span>Admin Panel &amp; Staff Management</span>
          </h1>
          <p className="text-xs text-[#777D76] mt-0.5">
            Centralized administration hub organizing product, inventory, analytics, staff, and sales history modules.
          </p>
        </div>

        <Badge variant={isAdmin ? 'admin' : 'staff'} className="py-1 px-3 gap-1.5 text-xs font-bold">
          {isAdmin ? <Unlock className="w-3.5 h-3.5 text-[#285943]" /> : <Lock className="w-3.5 h-3.5 text-[#71836A]" />}
          <span>{isAdmin ? 'ADMINISTRATOR PRIVILEGES ACTIVE' : 'STAFF ACCESS MODE'}</span>
        </Badge>
      </div>

      {/* Session Security Card */}
      <Card className={isAdmin ? 'border-[#C2D9C8] bg-[#EEF5F0]/20' : 'border-[#E5E4DC]'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
              {isAdmin ? <ShieldCheck className="w-5 h-5 text-[#285943]" /> : <ShieldAlert className="w-5 h-5 text-[#777D76]" />}
              <span>Session Authorization Status</span>
            </CardTitle>
            <span className="text-xs font-mono text-[#777D76]">
              {isAdmin ? `Active Admin: ${username || 'admin'}` : 'Unauthenticated (Staff Mode)'}
            </span>
          </div>
          <CardDescription>
            {isAdmin
              ? 'You have active administrative privileges. Bearer authorization token is attached to privileged API calls.'
              : 'The terminal is currently running under Staff mode. Admin Panel modules and privileged operations require Administrator authentication.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isAdmin ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#285943]">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0" />
                <span>Backend verified bearer token active via PBKDF2-HMAC-SHA256 (Windows CNG / OpenSSL)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAdminSession}
                className="text-xs text-[#A63A38] hover:bg-[#F8EFEF] hover:border-[#ECD1D0] gap-1.5 shrink-0 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Lock &amp; Return to Staff</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-white border border-[#E5E4DC] flex items-center justify-center text-[#777D76]">
                  <Key className="w-4 h-4 text-[#285943]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#303631]">Unlock Administrator Privileges</h4>
                  <p className="text-xs text-[#777D76]">
                    Enter the master administrator password to unlock full access across all 5 management modules.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUnlockModal(true)}
                className="gap-1.5 shrink-0 font-bold"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Admin Mode</span>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E5E4DC] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('hub')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'hub'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Admin Modules Hub (5)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brands')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'brands'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Brand Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'categories'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Category Manager</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'security'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Staff &amp; Role Security</span>
        </button>
      </div>

      {/* Tab 1: 5 Core Admin Modules Hub (Requirement 1B) */}
      {activeTab === 'hub' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#303631] uppercase tracking-wider">
              Management Modules Overview
            </h3>
            <span className="text-xs text-[#777D76]">
              All 5 modules require administrator authorization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {adminModules.map((mod) => {
              const Icon = mod.icon;
              return (
                <div
                  key={mod.id}
                  className="bg-white rounded border border-[#E5E4DC] hover:border-[#285943] transition-colors p-5 flex flex-col justify-between shadow-2xs group"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-[#285943] bg-[#EEF5F0] border border-[#C2D9C8] px-2 py-0.5 rounded">
                        {mod.badge}
                      </span>
                    </div>

                    <div>
                      <h4 className="text-base font-bold text-[#303631] group-hover:text-[#285943] transition-colors">
                        {mod.name}
                      </h4>
                      <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E4DC]">
                    {mod.action ? (
                      <button
                        type="button"
                        onClick={mod.action}
                        className="inline-flex items-center justify-between w-full text-xs font-bold text-[#285943] hover:text-[#1e4433]"
                      >
                        <span>Configure Module</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <Link
                        to={mod.path}
                        className="inline-flex items-center justify-between w-full text-xs font-bold text-[#285943] hover:text-[#1e4433]"
                      >
                        <span>Open Module</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Brand Manager */}
      {activeTab === 'brands' && (
        <div className="space-y-4">
          <BrandManager />
        </div>
      )}

      {/* Tab 3: Category Manager */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <CategoryManager />
        </div>
      )}

      {/* Tab 4: Staff & Role Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
                <UserCheck className="w-5 h-5 text-[#285943]" />
                <span>Staff &amp; Role Access Control Matrix</span>
              </CardTitle>
              <CardDescription>
                Overview of functional permissions assigned to Staff and Administrator accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4DC] text-[#777D76] font-semibold text-[10px] uppercase">
                    <th className="py-2.5 px-3">System Module / Workflow</th>
                    <th className="py-2.5 px-3 text-center">Staff Mode</th>
                    <th className="py-2.5 px-3 text-center">Administrator Mode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4DC]/60 text-xs text-[#303631]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Billing &amp; Checkout Terminal</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">View Product Catalog &amp; Search</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Create / Edit / Archive Products</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Protected</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Bearer Token)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Inventory Stock Adjustments</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Protected</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Bearer Token)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Brand &amp; Category Master Configuration</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Protected</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Bearer Token)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Sales Analytics &amp; Revenue Reports</td>
                    <td className="py-2.5 px-3 text-center text-[#777D76]">Standard View</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Full Access</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Quick Dual Brand & Category Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BrandManager />
            <CategoryManager />
          </div>
        </div>
      )}

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </div>
  );
};

export default AdminPage;
