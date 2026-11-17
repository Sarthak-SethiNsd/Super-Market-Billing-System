import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';
import { API_BASE_URL } from '@/services/api';
import {
  ShoppingCart,
  Package,
  Receipt,
  Boxes,
  BarChart3,
  UserCheck,
  Code2,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Lock,
  Unlock,
  CheckCircle2
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { status, healthData } = useHealth();
  const { role, isAdmin } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const adminModules = [
    {
      name: 'Product Management',
      path: '/products',
      icon: Package,
      desc: 'Catalog, pricing rules, product codes, brands, and categories.',
    },
    {
      name: 'Inventory Management',
      path: '/inventory',
      icon: Boxes,
      desc: 'Real-time stock tracking, low-stock warnings, and manual adjustments.',
    },
    {
      name: 'Sales Analytics',
      path: '/analytics',
      icon: BarChart3,
      desc: 'Gross revenue metrics, top-selling items, and category distribution.',
    },
    {
      name: 'Staff Management',
      path: '/admin',
      icon: UserCheck,
      desc: 'Role permissions, administrator unlock authentication, and session security.',
    },
    {
      name: 'Transactions & Sales History',
      path: '/transactions',
      icon: Receipt,
      desc: 'Immutable historical sales ledger, invoice snapshots, and receipt verification.',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="rounded bg-[#263B32] p-6 md:p-8 text-white shadow-xs relative overflow-hidden border border-[#334c41]">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded bg-[#1f3029] text-[#d6e2dc] text-xs font-semibold border border-[#334c41] w-fit max-w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-[#71836A]" />
              <span>Supermart Online Platform</span>
            </div>
            <span className="text-[#71836A] hidden sm:inline">•</span>
            <div className="text-[#b4c7be]">C++17 Crow + SQLite Backend Engine</div>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
            Supermarket Operations &amp; Management Dashboard
          </h1>

          <p className="text-[#b4c7be] text-sm md:text-base leading-relaxed">
            Welcome to the management workstation. The application operates in <strong className="text-white">{role} Mode</strong>. All financial transactions calculate prices and discounts in exact integer paise via the C++ domain engine.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/billing">
              <Button variant="primary" size="md" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                <span>Open Billing &amp; Checkout</span>
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="secondary" size="md" className="gap-2 bg-[#1f3029] hover:bg-[#192621] text-white border border-[#334c41]">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Panel</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient watermark background icon */}
        <div className="absolute right-4 -bottom-6 text-[#1f3029]/70 pointer-events-none select-none">
          <Server className="w-64 h-64 -rotate-12" />
        </div>
      </div>

      {/* Backend & Architecture Status Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Backend Connectivity Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
                <Server className="w-4 h-4 text-[#285943]" />
                Backend Connection
              </CardTitle>
              <Badge variant={status === 'connected' ? 'success' : status === 'checking' ? 'warning' : 'danger'}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>C++ Crow v1.3.4 + Standalone Asio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#777D76]">
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Service:</span>
              <span className="font-medium text-[#303631]">{healthData?.service || 'Supermarket Management API'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Engine Version:</span>
              <span className="font-mono text-[#303631]">{healthData?.version || '1.0.0'} (C++17)</span>
            </div>
            <div className="flex justify-between py-1 gap-2 flex-wrap">
              <span className="shrink-0">Base Endpoint:</span>
              <span className="font-mono text-[#303631] break-all text-right">{API_BASE_URL}</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Persistence Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
                <Database className="w-4 h-4 text-[#71836A]" />
                SQLite Persistence
              </CardTitle>
              <Badge variant="default">SCHEMA V2</Badge>
            </div>
            <CardDescription>Transactional ACID Storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#777D76]">
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Storage Location:</span>
              <span className="font-mono text-[#303631]">data/supermarket.db</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Monetary Precision:</span>
              <span className="font-medium text-[#303631]">Integer Paise (int64_t)</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Security Hashing:</span>
              <span className="font-medium text-[#303631]">PBKDF2-HMAC-SHA256</span>
            </div>
          </CardContent>
        </Card>

        {/* Authorization State Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-[#303631]">
                <ShieldCheck className="w-4 h-4 text-[#285943]" />
                Access Tier &amp; Security
              </CardTitle>
              <Badge variant={isAdmin ? 'admin' : 'staff'}>
                {role}
              </Badge>
            </div>
            <CardDescription>Role-Based Access Control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#777D76]">
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Active Mode:</span>
              <span className="font-semibold text-[#303631]">{isAdmin ? 'Administrative (Full Access)' : 'Staff Mode (Checkout & View)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span>Checkout Access:</span>
              <span className="text-[#2E6F40] font-semibold">Allowed</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Admin Management:</span>
              <span className={isAdmin ? 'text-[#2E6F40] font-semibold' : 'text-[#777D76]'}>
                {isAdmin ? 'Unlocked' : 'Requires Admin PIN'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TWO PRIMARY SECTIONS (STAGE 10 CORE STRUCTURE) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SECTION A: BILLING & CHECKOUT (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded border-2 border-[#285943] p-6 space-y-5 shadow-xs">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]">
                Primary Operation
              </span>
              <span className="text-xs text-[#2E6F40] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Checkout
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#303631] flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#285943]" />
              Billing &amp; Checkout
            </h2>
            <p className="text-xs text-[#777D76] leading-relaxed">
              Real-time checkout terminal for searching products, applying discounts, managing bill items, and printing customer receipts.
            </p>
          </div>

          {/* Key Capabilities Bullets (Requirement 1A) */}
          <div className="p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2 text-xs text-[#303631]">
            <div className="font-bold text-[11px] uppercase tracking-wider text-[#777D76] mb-1">
              Checkout Capabilities:
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Search products by name or barcode</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Add products to the bill</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Adjust quantities and remove items</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Apply available promotional discounts</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Calculate subtotal and final amount in integer paise</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                <span>Complete checkout and generate itemized receipt</span>
              </li>
            </ul>
          </div>

          <div>
            <Link
              to="/billing"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#285943] hover:bg-[#1e4433] text-white font-bold text-sm shadow-xs transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>Launch Billing &amp; Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* SECTION B: ADMIN PANEL (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded border border-[#E5E4DC] p-6 space-y-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E4DC] pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${isAdmin ? 'bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]' : 'bg-[#FAF3EA] text-[#C87D20] border border-[#F0DDC5]'}`}>
                  {isAdmin ? 'Administrator Mode Active' : 'Administrator Authorization Required'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-[#303631] flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#285943]" />
                Admin Panel
              </h2>
              <p className="text-xs text-[#777D76] mt-0.5">
                Centralized entry point organizing the 5 store administration modules.
              </p>
            </div>

            <div className="shrink-0">
              {isAdmin ? (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold text-[#285943] border-[#285943]">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Open Admin Hub</span>
                  </Button>
                </Link>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowUnlockModal(true)}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Unlock Admin</span>
                </Button>
              )}
            </div>
          </div>

          {/* The 5 Admin Modules List (Requirement 1B) */}
          <div className="space-y-2.5">
            {adminModules.map((mod, idx) => {
              const Icon = mod.icon;
              return (
                <Link
                  key={idx}
                  to={mod.path}
                  className="flex items-start justify-between p-3 rounded bg-[#FAF9F5] hover:bg-[#F0EDE1] border border-[#E5E4DC] hover:border-[#285943] transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded bg-white border border-[#E5E4DC] flex items-center justify-center text-[#285943] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#303631] group-hover:text-[#285943] transition-colors">
                          {mod.name}
                        </span>
                        {!isAdmin && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            Protected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#777D76] mt-0.5 leading-relaxed">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#777D76] group-hover:text-[#285943] group-hover:translate-x-1 transition-all shrink-0 mt-2" />
                </Link>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#E5E4DC] flex items-center justify-between text-xs text-[#777D76]">
            <span>Staff members only have access to authorized operational workflows.</span>
            <Link to="/admin" className="font-bold text-[#285943] hover:underline flex items-center gap-1">
              <span>Admin Management →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Discrete Academic Technical Section (Requirement 6) */}
      <div className="p-4 rounded bg-white border border-[#E5E4DC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#1f3029] text-white flex items-center justify-center shrink-0">
            <Code2 className="w-4 h-4 text-[#d6e2dc]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#303631] uppercase tracking-wider">
              Academic Reference: C++17 OOP Architecture Explorer
            </h4>
            <p className="text-xs text-[#777D76]">
              Interactive educational demonstration of Inheritance, Polymorphism, Encapsulation, and Design Patterns.
            </p>
          </div>
        </div>

        <Link to="/oop-concepts" className="shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs text-[#303631] hover:text-[#285943]">
            <Code2 className="w-3.5 h-3.5" />
            <span>Launch C++ Explorer</span>
          </Button>
        </Link>
      </div>

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </div>
  );
};

export default DashboardPage;
