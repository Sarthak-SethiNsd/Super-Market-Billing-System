import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  Boxes,
  Package,
  Receipt,
  BarChart3,
  UserCheck,
  ShieldAlert,
  Code2,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  ShieldCheck,
  Lock,
  Unlock,
  Server,
  Database
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useHealth } from '@/context/HealthContext';
import { API_BASE_URL } from '@/services/api';
import { Badge } from '@/components/ui/Badge';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';

export const HomePage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const { isAdmin, role } = useAuth();
  const { status, healthData } = useHealth();

  const adminModules = [
    {
      id: 'products',
      title: 'Product Management',
      route: '/products',
      icon: Package,
      desc: 'Catalog, pricing rules, product codes, brands, and categories.',
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      route: '/inventory',
      icon: Boxes,
      desc: 'Real-time stock tracking, low-stock warnings, and manual adjustments.',
    },
    {
      id: 'analytics',
      title: 'Sales Analytics',
      route: '/analytics',
      icon: BarChart3,
      desc: 'Gross revenue metrics, top-selling items, and category distribution.',
    },
    {
      id: 'admin',
      title: 'Staff Management',
      route: '/admin',
      icon: UserCheck,
      desc: 'Role permissions, administrator unlock authentication, and session security.',
    },
    {
      id: 'transactions',
      title: 'Transactions & Sales History',
      route: '/transactions',
      icon: Receipt,
      desc: 'Immutable historical sales ledger, invoice snapshots, and receipt verification.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F7F6F1] text-[#303631] flex flex-col font-sans selection:bg-[#285943] selection:text-white">
      {/* Top Application Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-[#E5E4DC] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Application Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded bg-[#285943] border border-[#3d5a4d] flex items-center justify-center text-white shrink-0 shadow-xs">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-[#303631] tracking-tight leading-tight group-hover:text-[#285943] transition-colors">
                Supermart
              </span>
              <span className="text-[11px] text-[#71836A] font-medium tracking-wide hidden sm:block">
                Online Supermarket Management Platform
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-6 text-xs font-semibold text-[#777D76]">
            <Link to="/dashboard" className="hover:text-[#285943] transition-colors">
              Dashboard
            </Link>
            <Link to="/billing" className="hover:text-[#285943] transition-colors">
              Billing &amp; Checkout
            </Link>
            <Link to="/admin" className="hover:text-[#285943] transition-colors">
              Admin Panel
            </Link>
            <Link to="/oop-concepts" className="hover:text-[#285943] transition-colors">
              OOP Concepts
            </Link>
          </nav>

          {/* Quick Header Actions */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              to="/billing"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded border border-[#E5E4DC] text-[#303631] bg-white hover:bg-[#FAF9F5] hover:border-[#285943] hover:text-[#285943] transition-colors"
              title="Launch Billing & Checkout"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#285943]" />
              <span>Billing &amp; Checkout</span>
            </Link>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded bg-[#285943] hover:bg-[#1e4433] text-white border border-[#3d5a4d] transition-colors shadow-xs"
              title="Open Operations Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <div className="xl:hidden flex items-center gap-2">
            <Link
              to="/billing"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded bg-[#285943] text-white hover:bg-[#1e4433] transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Billing</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#303631] hover:text-[#285943] hover:bg-[#FAF9F5] rounded transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-[#E5E4DC] px-4 pt-3 pb-5 space-y-2 shadow-sm">
            <div className="px-3 py-1 text-[10px] font-bold text-[#71836A] uppercase tracking-wider">
              Management Portal
            </div>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm font-semibold text-[#303631]">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <LayoutDashboard className="w-4 h-4 text-[#71836A]" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <ShoppingCart className="w-4 h-4 text-[#71836A]" />
                <span>Billing &amp; Checkout</span>
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <ShieldAlert className="w-4 h-4 text-[#71836A]" />
                <span>Admin Panel</span>
              </Link>
              <Link
                to="/oop-concepts"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <Code2 className="w-4 h-4 text-[#71836A]" />
                <span>OOP Concepts Explorer</span>
              </Link>
            </nav>
            <div className="pt-2 border-t border-[#E5E4DC]">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold rounded bg-[#285943] text-white hover:bg-[#1e4433] border border-[#3d5a4d]"
              >
                <LayoutDashboard className="w-4 h-4 text-[#d6e2dc]" />
                <span>Open Operations Dashboard</span>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Software Control Banner */}
      <section className="bg-[#263B32] text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-[#334c41]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-[#1f3029] border border-[#334c41] text-[#d6e2dc] text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#71836A]" />
                <span>Supermart Online Platform • Real-Time Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Supermarket Billing &amp; Inventory Management Platform
              </h1>
              <p className="text-xs sm:text-sm text-[#b4c7be] leading-relaxed">
                Supermart is a clean, organized management platform. The application provides two primary workflows: fast Billing &amp; Checkout for processing sales orders, and a centralized Admin Panel for managing products, inventory, staff, and financial analytics.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/billing"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-bold text-xs bg-[#285943] hover:bg-[#1e4433] text-white border border-[#3d5a4d] transition-colors shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Billing &amp; Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-bold text-xs bg-[#1f3029] hover:bg-[#192621] text-white border border-[#334c41] transition-colors"
              >
                <ShieldAlert className="w-4 h-4 text-[#71836A]" />
                <span>Admin Panel</span>
              </Link>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#334c41]">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Accurate Billing</span>
                <span className="text-[11px] text-[#9cb5a8]">Precise Decimal-Free Totals</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Automatic Stock Updates</span>
                <span className="text-[11px] text-[#9cb5a8]">Real-Time Inventory Sync</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Secure Staff Access</span>
                <span className="text-[11px] text-[#9cb5a8]">Protected Management Tools</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Flexible Discounts</span>
                <span className="text-[11px] text-[#9cb5a8]">Percentage &amp; Flat Savings</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Two-Section Application Dashboard (Requirement 1) */}
      <main className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* SECTION A: BILLING & CHECKOUT (5 cols) */}
          <div className="lg:col-span-5 bg-white rounded border-2 border-[#285943] p-6 space-y-5 shadow-xs">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8]">
                  Section A • Online Checkout
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
                Primary workflow for searching product codes, building customer orders, evaluating line item discounts, and printing receipts.
              </p>
            </div>

            {/* Feature Bullets (Requirement 1A) */}
            <div className="p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2 text-xs text-[#303631]">
              <div className="font-bold text-[11px] uppercase tracking-wider text-[#777D76] mb-1">
                Checkout Workflow Capabilities:
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
                  <span>Calculate subtotal and final amount</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#285943] shrink-0 mt-0.5" />
                  <span>Complete checkout and generate receipt</span>
                </li>
              </ul>
            </div>

            <div>
              <Link
                to="/billing"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded bg-[#285943] hover:bg-[#1e4433] text-white font-bold text-sm shadow-xs transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Open Billing &amp; Checkout</span>
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
                  Unified administrative control center organizing the 5 management modules.
                </p>
              </div>

              <div className="shrink-0">
                {isAdmin ? (
                  <Link to="/admin">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#285943] text-xs font-bold text-[#285943] hover:bg-[#EEF5F0] transition-colors"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Open Admin Hub</span>
                    </button>
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowUnlockModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#285943] text-white text-xs font-bold hover:bg-[#1e4433] transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* The 5 Admin Modules (Requirement 1B) */}
            <div className="space-y-2.5">
              {adminModules.map((mod) => {
                const Icon = mod.icon;
                return (
                  <Link
                    key={mod.id}
                    to={mod.route}
                    className="flex items-start justify-between p-3 rounded bg-[#FAF9F5] hover:bg-[#F0EDE1] border border-[#E5E4DC] hover:border-[#285943] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded bg-white border border-[#E5E4DC] flex items-center justify-center text-[#285943] shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-[#303631] group-hover:text-[#285943] transition-colors">
                            {mod.title}
                          </span>
                          {!isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Admin Only
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
              <span>Staff accounts have access to checkout and assigned operational views only.</span>
              <Link to="/admin" className="font-bold text-[#285943] hover:underline flex items-center gap-1">
                <span>Admin Hub →</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Academic Reference: C++17 OOP Architecture Explorer (Requirement 6) */}
        <section className="bg-white rounded border border-[#E5E4DC] p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-[#1f3029] text-white flex items-center justify-center shrink-0">
              <Code2 className="w-4 h-4 text-[#d6e2dc]" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#303631] uppercase tracking-wider">
                Academic Reference: C++17 OOP Architecture Explorer
              </h3>
              <p className="text-xs text-[#777D76]">
                Interactive academic explorer covering Inheritance, Polymorphism, Encapsulation, Abstraction, and Strategy Patterns.
              </p>
            </div>
          </div>

          <Link
            to="/oop-concepts"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded border border-[#E5E4DC] text-xs font-bold text-[#303631] hover:text-[#285943] hover:border-[#285943] transition-colors shrink-0"
          >
            <Code2 className="w-3.5 h-3.5 text-[#285943]" />
            <span>Open C++ Explorer</span>
          </Link>
        </section>

        {/* System Diagnostics & Architecture Reference (Relocated from Dashboard) */}
        <section className="bg-white rounded border border-[#E5E4DC] p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5E4DC] pb-3">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-[#285943]" />
              <h3 className="text-xs font-bold text-[#303631] uppercase tracking-wider">
                System Diagnostics &amp; Engine Status
              </h3>
            </div>
            <Badge variant={status === 'connected' ? 'success' : status === 'checking' ? 'warning' : 'danger'}>
              {status.toUpperCase()}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#777D76]">
            {/* Backend Connectivity */}
            <div className="p-3 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2">
              <div className="flex items-center justify-between text-[#303631] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-[#285943]" />
                  <span>REST API Engine</span>
                </span>
                <span className="font-mono text-[11px] text-[#285943]">{healthData?.version || '1.0.0'}</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Implementation:</span>
                  <span className="font-medium text-[#303631]">C++17 Crow v1.3.4 + Asio</span>
                </div>
                <div className="flex justify-between">
                  <span>Endpoint:</span>
                  <span className="font-mono text-[#303631] truncate ml-1">{API_BASE_URL}</span>
                </div>
              </div>
            </div>

            {/* SQLite Persistence */}
            <div className="p-3 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2">
              <div className="flex items-center justify-between text-[#303631] font-semibold">
                <span className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#71836A]" />
                  <span>Persistence Layer</span>
                </span>
                <span className="font-mono text-[11px] text-[#71836A]">SCHEMA V4</span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Database:</span>
                  <span className="font-medium text-[#303631]">SQLite ACID Storage</span>
                </div>
                <div className="flex justify-between">
                  <span>Precision:</span>
                  <span className="font-medium text-[#303631]">Integer Paise (int64_t)</span>
                </div>
              </div>
            </div>

            {/* Security & Access Tier */}
            <div className="p-3 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2">
              <div className="flex items-center justify-between text-[#303631] font-semibold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#285943]" />
                  <span>Security &amp; Auth</span>
                </span>
                <Badge variant={isAdmin ? 'admin' : 'staff'} className="text-[10px]">
                  {role}
                </Badge>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Password Hash:</span>
                  <span className="font-medium text-[#303631]">PBKDF2-HMAC-SHA256</span>
                </div>
                <div className="flex justify-between">
                  <span>Access Tier:</span>
                  <span className="font-medium text-[#303631]">{isAdmin ? 'Administrator (Full)' : 'Staff (Checkout)'}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Application Footer */}
      <footer className="bg-[#263B32] text-[#d6e2dc] text-xs pt-8 pb-6 border-t border-[#334c41]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#285943] border border-[#3d5a4d] flex items-center justify-center text-white">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <span className="text-sm font-bold text-white tracking-tight">Supermart</span>
                <span className="text-xs text-[#9cb5a8] block">Supermarket Billing &amp; Inventory Management Platform</span>
              </div>
            </div>

            {/* Direct Module Links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#b4c7be]">
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <span>•</span>
              <Link to="/billing" className="hover:text-white transition-colors">Billing &amp; Checkout</Link>
              <span>•</span>
              <Link to="/admin" className="hover:text-white transition-colors">Admin Panel</Link>
              <span>•</span>
              <Link to="/products" className="hover:text-white transition-colors">Products</Link>
              <span>•</span>
              <Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link>
              <span>•</span>
              <Link to="/transactions" className="hover:text-white transition-colors">Transactions</Link>
              <span>•</span>
              <Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link>
              <span>•</span>
              <Link to="/oop-concepts" className="hover:text-white transition-colors">C++ OOP Architecture</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-[#334c41] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9cb5a8]">
            <div>
              &copy; {new Date().getFullYear()} Supermart. Supermarket Billing &amp; Inventory Management Platform. All rights reserved.
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span>C++17 Crow Core</span>
              <span>•</span>
              <span>SQLite ACID</span>
              <span>•</span>
              <span>React 18</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </div>
  );
};

export default HomePage;
