import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Store,
  ShoppingCart,
  Boxes,
  Package,
  Receipt,
  BarChart3,
  ShieldAlert,
  Code2,
  LayoutDashboard,
  CheckCircle2,
  ArrowRight,
  Menu,
  X,
  Cpu,
  Database,
  ShieldCheck,
  TrendingUp,
  Sliders
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const applicationModules = [
    {
      id: 'billing',
      title: 'Billing / POS Terminal',
      route: '/billing',
      icon: ShoppingCart,
      category: 'Sales & Checkout',
      desc: 'Rapid barcode and SKU scanning, real-time cart computation, discount strategy evaluation, and printable itemized invoices.',
      features: ['Barcode & SKU Scanner', 'Itemized Line Items', 'Instant Invoice Print'],
    },
    {
      id: 'products',
      title: 'Product Management',
      route: '/products',
      icon: Package,
      category: 'Catalog Administration',
      desc: 'Comprehensive catalog control: manage product listings, SKU identifiers, pricing rules, brands, and category taxonomy.',
      features: ['SKU & Barcode Indexing', 'Category & Brand Sorting', 'Product Modal Editor'],
    },
    {
      id: 'inventory',
      title: 'Inventory Management',
      route: '/inventory',
      icon: Boxes,
      category: 'Stock Control',
      desc: 'Live stock monitoring, automated stock deduction on checkout, low-stock threshold alerts, and manual inventory adjustments.',
      features: ['Real-Time Stock Sync', 'Low-Stock Warnings', 'Movement Audit Logs'],
    },
    {
      id: 'transactions',
      title: 'Transactions & Receipts',
      route: '/transactions',
      icon: Receipt,
      category: 'Audit Ledger',
      desc: 'Immutable historical ledger of all generated sales invoices with frozen price snapshots and thermal receipt reprinting.',
      features: ['Immutable Ledger', 'Invoice Search', 'Thermal Receipt Reprint'],
    },
    {
      id: 'analytics',
      title: 'Sales Analytics',
      route: '/analytics',
      icon: BarChart3,
      category: 'Performance Reports',
      desc: 'Visual reporting dashboards for gross revenue, sales trends, top-performing products, and category volume breakdowns.',
      features: ['Revenue Trends', 'Best-Selling Products', 'Category Breakdown'],
    },
    {
      id: 'admin',
      title: 'Admin & Staff Management',
      route: '/admin',
      icon: ShieldAlert,
      category: 'Security & Access',
      desc: 'Role-based access administration, category and brand configuration, system diagnostic logs, and security controls.',
      features: ['Category & Brand Setup', 'Role Permission Toggles', 'System Diagnostics'],
    },
    {
      id: 'oop-concepts',
      title: 'OOP Concepts Explorer',
      route: '/oop-concepts',
      icon: Code2,
      category: 'C++17 Architecture',
      desc: 'Interactive academic explorer demonstrating Object-Oriented Programming principles: Inheritance, Polymorphism, Encapsulation, and Abstraction.',
      features: ['Interactive C++ Demos', 'Concept Architecture', 'Knowledge Evaluation'],
    },
  ];

  const systemSpecifications = [
    {
      icon: Cpu,
      title: 'C++17 Engine Core',
      desc: 'Engineered with clean domain class hierarchies, abstract base classes, polymorphism for billing rules, and strong encapsulation.',
    },
    {
      icon: Database,
      title: 'Transactional SQLite Ledger',
      desc: 'Atomic operations during invoice generation ensure that product inventory quantities update consistently without discrepancies.',
    },
    {
      icon: ShieldCheck,
      title: 'Role-Based Access Control',
      desc: 'Distinct separation between Staff (terminal POS operators) and Administrator modes with PIN-authenticated administrative elevation.',
    },
    {
      icon: TrendingUp,
      title: 'Monetary Arithmetic Safety',
      desc: 'All calculations are computed in exact 64-bit integer paise (int64_t) to prevent IEEE-754 floating-point rounding errors.',
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
                Billing &amp; Inventory Management System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-5 text-xs font-semibold text-[#777D76]">
            <Link to="/dashboard" className="hover:text-[#285943] transition-colors">
              Dashboard
            </Link>
            <Link to="/billing" className="hover:text-[#285943] transition-colors">
              Billing / POS
            </Link>
            <Link to="/products" className="hover:text-[#285943] transition-colors">
              Products
            </Link>
            <Link to="/inventory" className="hover:text-[#285943] transition-colors">
              Inventory
            </Link>
            <Link to="/transactions" className="hover:text-[#285943] transition-colors">
              Transactions
            </Link>
            <Link to="/analytics" className="hover:text-[#285943] transition-colors">
              Analytics
            </Link>
            <Link to="/admin" className="hover:text-[#285943] transition-colors">
              Admin
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
              title="Launch POS Billing Terminal"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-[#285943]" />
              <span>POS Terminal</span>
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
              <span>POS</span>
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-[#303631] hover:text-[#285943] hover:bg-[#FAF9F5] rounded transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="xl:hidden bg-white border-b border-[#E5E4DC] px-4 pt-3 pb-5 space-y-2 shadow-sm">
            <div className="px-3 py-1 text-[10px] font-bold text-[#71836A] uppercase tracking-wider">
              Management Modules
            </div>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm font-semibold text-[#303631]">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <LayoutDashboard className="w-4 h-4 text-[#71836A]" />
                <span>Operations Dashboard</span>
              </Link>
              <Link
                to="/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <ShoppingCart className="w-4 h-4 text-[#71836A]" />
                <span>Billing / POS Terminal</span>
              </Link>
              <Link
                to="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <Package className="w-4 h-4 text-[#71836A]" />
                <span>Product Management</span>
              </Link>
              <Link
                to="/inventory"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <Boxes className="w-4 h-4 text-[#71836A]" />
                <span>Inventory Management</span>
              </Link>
              <Link
                to="/transactions"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <Receipt className="w-4 h-4 text-[#71836A]" />
                <span>Transactions &amp; Receipts</span>
              </Link>
              <Link
                to="/analytics"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <BarChart3 className="w-4 h-4 text-[#71836A]" />
                <span>Sales Analytics</span>
              </Link>
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded hover:bg-[#FAF9F5] hover:text-[#285943]"
              >
                <ShieldAlert className="w-4 h-4 text-[#71836A]" />
                <span>Admin &amp; Staff Management</span>
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
                <span>Launch Operations Dashboard</span>
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
                <Cpu className="w-3.5 h-3.5 text-[#71836A]" />
                <span>C++17 Crow Core • Transactional SQLite Engine</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Supermarket Billing &amp; Inventory Management System
              </h1>
              <p className="text-xs sm:text-sm text-[#b4c7be] leading-relaxed">
                Supermart is a centralized software management platform powered by a high-performance C++ domain engine. Select any application module below to execute POS billing, update catalog records, monitor inventory, or analyze sales transactions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Link
                to="/billing"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-bold text-xs bg-[#285943] hover:bg-[#1e4433] text-white border border-[#3d5a4d] transition-colors shadow-xs"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Launch POS</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded font-bold text-xs bg-[#1f3029] hover:bg-[#192621] text-white border border-[#334c41] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#71836A]" />
                <span>Dashboard</span>
              </Link>
              <Link
                to="/oop-concepts"
                className="inline-flex items-center gap-2 px-3 py-2.5 rounded font-semibold text-xs text-[#d6e2dc] hover:text-white hover:bg-[#1f3029] border border-transparent hover:border-[#334c41] transition-colors"
              >
                <Code2 className="w-4 h-4 text-[#71836A]" />
                <span>C++ OOP</span>
              </Link>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-[#334c41]">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Integer Currency</span>
                <span className="text-[11px] text-[#9cb5a8]">Exact int64_t Paise</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Atomic Stock Sync</span>
                <span className="text-[11px] text-[#9cb5a8]">ACID SQLite Transactions</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Role-Based Access</span>
                <span className="text-[11px] text-[#9cb5a8]">Staff &amp; Admin Privileges</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-[#71836A] shrink-0" />
              <div>
                <span className="font-bold text-white block">Strategy Discounts</span>
                <span className="text-[11px] text-[#9cb5a8]">Polymorphic Rules</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Application Modules Grid */}
      <main className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full flex-1 space-y-10">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#303631] tracking-tight">
                Application Modules
              </h2>
              <p className="text-xs text-[#777D76]">
                Direct entry points to the management and billing operations.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#777D76]">
              <Sliders className="w-3.5 h-3.5 text-[#285943]" />
              <span>7 Modules Configured</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {applicationModules.map((module) => {
              const Icon = module.icon;
              return (
                <div
                  key={module.id}
                  className="bg-white rounded border border-[#E5E4DC] hover:border-[#285943] transition-colors p-5 flex flex-col justify-between group shadow-2xs"
                >
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-10 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold text-[#285943] bg-[#EEF5F0] border border-[#C2D9C8] px-2 py-0.5 rounded">
                        {module.category}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-[#303631] group-hover:text-[#285943] transition-colors">
                        {module.title}
                      </h3>
                      <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                        {module.desc}
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-[#E5E4DC]">
                      <div className="flex flex-wrap gap-1.5">
                        {module.features.map((feature, i) => (
                          <span
                            key={i}
                            className="text-[10px] font-medium bg-[#FAF9F5] text-[#303631] border border-[#E5E4DC] px-2 py-0.5 rounded"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#E5E4DC]">
                    <Link
                      to={module.route}
                      className="inline-flex items-center justify-between w-full text-xs font-bold text-[#285943] hover:text-[#1e4433] group/btn"
                    >
                      <span>Open Module</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Technical Architecture Specifications */}
        <section className="bg-white rounded border border-[#E5E4DC] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[#E5E4DC] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#303631] uppercase tracking-wider">
                Software Architecture &amp; Engineering Specifications
              </h3>
              <p className="text-xs text-[#777D76]">
                Technical principles and core architectural design patterns implemented in the software.
              </p>
            </div>
            <Link
              to="/oop-concepts"
              className="text-xs font-bold text-[#285943] hover:underline flex items-center gap-1"
            >
              <span>Explore C++ Explorer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {systemSpecifications.map((spec, idx) => {
              const Icon = spec.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded bg-[#FAF9F5] border border-[#E5E4DC] space-y-2"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-[#303631]">
                    <Icon className="w-4 h-4 text-[#285943]" />
                    <span>{spec.title}</span>
                  </div>
                  <p className="text-xs text-[#777D76] leading-relaxed">
                    {spec.desc}
                  </p>
                </div>
              );
            })}
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
                <span className="text-xs text-[#9cb5a8] block">Supermarket Billing &amp; Inventory Management System</span>
              </div>
            </div>

            {/* Direct Module Links */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[#b4c7be]">
              <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
              <span>•</span>
              <Link to="/billing" className="hover:text-white transition-colors">Billing / POS</Link>
              <span>•</span>
              <Link to="/products" className="hover:text-white transition-colors">Products</Link>
              <span>•</span>
              <Link to="/inventory" className="hover:text-white transition-colors">Inventory</Link>
              <span>•</span>
              <Link to="/transactions" className="hover:text-white transition-colors">Transactions</Link>
              <span>•</span>
              <Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link>
              <span>•</span>
              <Link to="/admin" className="hover:text-white transition-colors">Admin</Link>
              <span>•</span>
              <Link to="/oop-concepts" className="hover:text-white transition-colors">OOP Concepts</Link>
            </div>
          </div>

          <div className="pt-4 border-t border-[#334c41] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#9cb5a8]">
            <div>
              &copy; {new Date().getFullYear()} Supermart. Supermarket Billing &amp; Inventory Management System. All rights reserved.
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
    </div>
  );
};

export default HomePage;
