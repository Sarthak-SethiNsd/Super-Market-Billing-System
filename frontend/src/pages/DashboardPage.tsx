import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useHealth } from '@/context/HealthContext';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/services/api';
import {
  ShoppingCart,
  Package,
  Receipt,
  Boxes,
  Code2,
  Server,
  Database,
  ArrowRight,
  ShieldCheck,
  Cpu
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { status, healthData } = useHealth();
  const { role, isAdmin } = useAuth();

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 text-white shadow-lg relative overflow-hidden border border-slate-700/50">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            Stage 4 Foundation Active • C++17 Crow + SQLite Backend
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Supermarket Operations & Billing Command Center
          </h2>
          <p className="text-slate-300 text-sm md:text-base leading-relaxed">
            Welcome to the retail workstation. The application operates in <strong className="text-white">{role} Mode</strong>. All financial transactions calculate prices and discounts in exact integer paise via the C++ domain engine.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/billing">
              <Button variant="primary" size="md" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Launch POS Billing Terminal
              </Button>
            </Link>
            <Link to="/oop-concepts">
              <Button variant="secondary" size="md" className="gap-2 bg-slate-700 hover:bg-slate-600 text-white border border-slate-600">
                <Code2 className="w-4 h-4" />
                Explore C++ OOP Architecture
              </Button>
            </Link>
          </div>
        </div>

        {/* Ambient watermark background icon */}
        <div className="absolute right-4 -bottom-6 text-slate-800/40 pointer-events-none select-none">
          <Server className="w-64 h-64 -rotate-12" />
        </div>
      </div>

      {/* Backend & Architecture Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Backend Connectivity Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                C++ REST API Engine
              </CardTitle>
              <Badge variant={status === 'connected' ? 'success' : status === 'checking' ? 'warning' : 'danger'}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>Crow v1.3.4 + Standalone Asio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Service:</span>
              <span className="font-medium text-slate-900">{healthData?.service || 'Supermarket Management API'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Engine Version:</span>
              <span className="font-mono text-slate-900">{healthData?.version || '1.0.0'} (C++17)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Base Endpoint:</span>
              <span className="font-mono text-slate-900">{API_BASE_URL}</span>
            </div>
          </CardContent>
        </Card>

        {/* Database Persistence Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                SQLite Persistence
              </CardTitle>
              <Badge variant="default">SCHEMA V2</Badge>
            </div>
            <CardDescription>Transactional ACID Storage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Storage Location:</span>
              <span className="font-mono text-slate-900">data/supermarket.db</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Monetary Precision:</span>
              <span className="font-medium text-slate-900">Integer Paise (int64_t)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Security:</span>
              <span className="font-medium text-slate-900">PBKDF2-HMAC-SHA256</span>
            </div>
          </CardContent>
        </Card>

        {/* Authorization State Card */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Access Tier & Security
              </CardTitle>
              <Badge variant={isAdmin ? 'admin' : 'staff'}>
                {role}
              </Badge>
            </div>
            <CardDescription>Role-Based Access Control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-slate-600">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">Active Mode:</span>
              <span className="font-semibold text-slate-900">{isAdmin ? 'Administrative (Full)' : 'Cashier / POS (Standard)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500">POS Checkout:</span>
              <span className="text-emerald-600 font-semibold">Allowed</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Catalog Modification:</span>
              <span className={isAdmin ? 'text-purple-600 font-semibold' : 'text-slate-400'}>
                {isAdmin ? 'Unlocked' : 'Requires Admin'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-base font-bold text-slate-900 mb-3 tracking-tight">System Navigation Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/billing" className="group">
            <Card className="p-5 h-full hover:border-emerald-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors flex items-center justify-between">
                Billing / POS
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Atomic barcode scanning, line discounts, and instant invoice snapshots.
              </p>
            </Card>
          </Link>

          <Link to="/products" className="group">
            <Card className="p-5 h-full hover:border-blue-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Package className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-blue-600 transition-colors flex items-center justify-between">
                Product Catalog
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Perishable & non-perishable inventory with Strategy-pattern discounts.
              </p>
            </Card>
          </Link>

          <Link to="/inventory" className="group">
            <Card className="p-5 h-full hover:border-amber-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Boxes className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-amber-600 transition-colors flex items-center justify-between">
                Inventory Audit
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Stock audit trails, real-time movements, and manual adjustments.
              </p>
            </Card>
          </Link>

          <Link to="/transactions" className="group">
            <Card className="p-5 h-full hover:border-indigo-300 hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Receipt className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors flex items-center justify-between">
                Invoices & Sales
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Historical receipts with immutable unit prices and line totals.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
