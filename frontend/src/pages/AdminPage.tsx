import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { BrandManager } from '@/components/admin/BrandManager';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { CategoryBrandManager } from '@/components/admin/CategoryBrandManager';
import { CustomerManager } from '@/components/admin/CustomerManager';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';
import {
  ShieldCheck,
  Key,
  Lock,
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
  Shield,
  Users,
  Link2
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { isStaff, username, logoutStaff } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'hub' | 'customers' | 'brands' | 'categories' | 'category-brands' | 'security'>('hub');

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
            <ShieldCheck className="w-6 h-6 text-[#285943]" />
            <span>Staff &amp; System Management</span>
          </h1>
          <p className="text-xs text-[#777D76] mt-0.5">
            Centralized staff operations hub organizing products, inventory, customers, categories, brands, and telemetry.
          </p>
        </div>

        <Badge variant={isStaff ? 'staff' : 'default'} className={`py-1 px-3 gap-1.5 text-xs font-bold ${isStaff ? 'bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]' : 'bg-[#FAF9F5] text-[#777D76] border border-[#E5E4DC]'}`}>
          {isStaff ? <ShieldCheck className="w-3.5 h-3.5 text-[#285943]" /> : <Lock className="w-3.5 h-3.5 text-[#71836A]" />}
          <span>{isStaff ? 'STAFF MODE ACTIVE' : 'STAFF LOGIN REQUIRED'}</span>
        </Badge>
      </div>

      {/* Session Security Card */}
      <Card className={isStaff ? 'border-[#C2D9C8] bg-[#EEF5F0]/20' : 'border-[#E5E4DC]'}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
              <ShieldCheck className="w-5 h-5 text-[#285943]" />
              <span>Session Authorization Status</span>
            </CardTitle>
            <span className="text-xs font-mono text-[#777D76]">
              {isStaff ? `Active Staff: ${username || 'staff'}` : 'Customer Mode (Unauthenticated)'}
            </span>
          </div>
          <CardDescription>
            {isStaff
              ? 'You have active staff management privileges. Bearer authorization token is attached to management API calls.'
              : 'The terminal is currently running in Customer Mode. Management modules and privileged operations require Staff authentication.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isStaff ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-[#285943]">
                <CheckCircle2 className="w-4 h-4 text-[#285943] shrink-0" />
                <span>Backend verified bearer token active via PBKDF2-HMAC-SHA256 (Windows CNG / OpenSSL)</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={logoutStaff}
                className="text-xs text-[#A63A38] hover:bg-[#F8EFEF] hover:border-[#ECD1D0] gap-1.5 shrink-0 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Staff Mode</span>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded bg-white border border-[#E5E4DC] flex items-center justify-center text-[#777D76]">
                  <Key className="w-4 h-4 text-[#285943]" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-[#303631]">Staff Mode Authentication</h4>
                  <p className="text-xs text-[#777D76]">
                    Enter the staff password to unlock full access across all 5 management modules.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowUnlockModal(true)}
                className="gap-1.5 shrink-0 font-bold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Staff Login</span>
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
          onClick={() => setActiveTab('customers')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'customers'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Customer Directory</span>
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
          onClick={() => setActiveTab('category-brands')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded transition-colors flex items-center gap-1.5 ${
            activeTab === 'category-brands'
              ? 'bg-[#285943] text-white shadow-xs'
              : 'text-[#777D76] hover:text-[#303631] hover:bg-white'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span>Category-Brand Matrix</span>
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

      {/* Tab 1: 5 Core Management Modules Hub */}
      {activeTab === 'hub' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#303631] uppercase tracking-wider">
              Management Modules Overview
            </h3>
            <span className="text-xs text-[#777D76]">
              All 5 modules fully accessible in Staff Mode
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

      {/* Tab: Customer Manager */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          <CustomerManager />
        </div>
      )}

      {/* Tab 3: Category Manager */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <CategoryManager />
        </div>
      )}

      {/* Tab: Category-Brand Associations (Stage 10L) */}
      {activeTab === 'category-brands' && (
        <div className="space-y-4">
          <CategoryBrandManager />
        </div>
      )}

      {/* Tab 4: Staff & Role Security */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
                <UserCheck className="w-5 h-5 text-[#285943]" />
                <span>Two-Mode Access Control Matrix (Customer Mode vs Staff Mode)</span>
              </CardTitle>
              <CardDescription>
                System authorization enforcing exact two-mode operations between Customer and Staff tiers.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E4DC] text-[#777D76] font-semibold text-[10px] uppercase">
                    <th className="py-2.5 px-3">System Module / Workflow</th>
                    <th className="py-2.5 px-3 text-center">Customer Mode</th>
                    <th className="py-2.5 px-3 text-center">Staff Mode (Full Management)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E4DC]/60 text-xs text-[#303631]">
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Browse Products, Categories &amp; Pricing</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Shopping Cart &amp; POS Checkout</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">View Generated Receipt Snapshot</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Own Receipt)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Add / Edit / Deactivate Products</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Blocked (401/403)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Full Access)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Inventory Stock Adjustments &amp; Alerts</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Blocked (401/403)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Full Access)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Brand &amp; Category Master Configuration</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Blocked (401/403)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Full Access)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Sales Analytics &amp; Revenue Reports</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Blocked (401/403)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Full Access)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-semibold">Complete Transactions &amp; Sales Ledger</td>
                    <td className="py-2.5 px-3 text-center text-[#A63A38] font-bold">Blocked (401/403)</td>
                    <td className="py-2.5 px-3 text-center text-[#2E6F40] font-bold">Allowed (Full Access)</td>
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

      {/* Staff Login Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </div>
  );
};

export default AdminPage;
