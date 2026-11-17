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
      <div className="rounded bg-[#263B32] p-6 md:p-8 text-white shadow-xs relative overflow-hidden border border-[#334c41]">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded bg-[#1f3029] text-[#d6e2dc] text-xs font-semibold border border-[#334c41] w-fit max-w-full">
            <div className="flex items-center gap-1.5 shrink-0">
              <Cpu className="w-3.5 h-3.5 text-[#71836A]" />
              <span>Stage 4 Foundation Active</span>
            </div>
            <span className="text-[#71836A] hidden sm:inline">•</span>
            <div className="text-[#b4c7be]">C++17 Crow + SQLite Backend</div>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
            Supermarket Operations & Billing Command Center
          </h2>
          <p className="text-[#b4c7be] text-sm md:text-base leading-relaxed">
            Welcome to the management workstation. The application operates in <strong className="text-white">{role} Mode</strong>. All financial transactions calculate prices and discounts in exact integer paise via the C++ domain engine.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link to="/billing">
              <Button variant="primary" size="md" className="gap-2">
                <ShoppingCart className="w-4 h-4" />
                Launch POS Billing Terminal
              </Button>
            </Link>
            <Link to="/oop-concepts">
              <Button variant="secondary" size="md" className="gap-2 bg-[#1f3029] hover:bg-[#192621] text-white border border-[#334c41]">
                <Code2 className="w-4 h-4" />
                Explore C++ OOP Architecture
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
                C++ REST API Engine
              </CardTitle>
              <Badge variant={status === 'connected' ? 'success' : status === 'checking' ? 'warning' : 'danger'}>
                {status.toUpperCase()}
              </Badge>
            </div>
            <CardDescription>Crow v1.3.4 + Standalone Asio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#777D76]">
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span className="text-[#777D76]">Service:</span>
              <span className="font-medium text-[#303631]">{healthData?.service || 'Supermarket Management API'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span className="text-[#777D76]">Engine Version:</span>
              <span className="font-mono text-[#303631]">{healthData?.version || '1.0.0'} (C++17)</span>
            </div>
            <div className="flex justify-between py-1 gap-2 flex-wrap">
              <span className="text-[#777D76] shrink-0">Base Endpoint:</span>
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
              <span className="text-[#777D76]">Storage Location:</span>
              <span className="font-mono text-[#303631]">data/supermarket.db</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span className="text-[#777D76]">Monetary Precision:</span>
              <span className="font-medium text-[#303631]">Integer Paise (int64_t)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#777D76]">Security:</span>
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
                Access Tier & Security
              </CardTitle>
              <Badge variant={isAdmin ? 'admin' : 'staff'}>
                {role}
              </Badge>
            </div>
            <CardDescription>Role-Based Access Control</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-[#777D76]">
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span className="text-[#777D76]">Active Mode:</span>
              <span className="font-semibold text-[#303631]">{isAdmin ? 'Administrative (Full)' : 'Cashier / POS (Standard)'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#E5E4DC]">
              <span className="text-[#777D76]">POS Checkout:</span>
              <span className="text-[#2E6F40] font-semibold">Allowed</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#777D76]">Catalog Modification:</span>
              <span className={isAdmin ? 'text-[#303631] font-semibold' : 'text-[#777D76]'}>
                {isAdmin ? 'Unlocked' : 'Requires Admin'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation Cards */}
      <div>
        <h3 className="text-sm font-bold text-[#303631] mb-3 tracking-tight uppercase">System Navigation Modules</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/billing" className="group">
            <Card className="p-4 h-full border-[#E5E4DC] hover:border-[#285943] transition-colors rounded">
              <div className="w-9 h-9 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center mb-2.5">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-[#303631] text-sm group-hover:text-[#285943] transition-colors flex items-center justify-between">
                Billing / POS
                <ArrowRight className="w-3.5 h-3.5 text-[#777D76] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                Atomic barcode scanning, line discounts, and instant invoice snapshots.
              </p>
            </Card>
          </Link>

          <Link to="/products" className="group">
            <Card className="p-4 h-full border-[#E5E4DC] hover:border-[#285943] transition-colors rounded">
              <div className="w-9 h-9 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center mb-2.5">
                <Package className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-[#303631] text-sm group-hover:text-[#285943] transition-colors flex items-center justify-between">
                Product Catalog
                <ArrowRight className="w-3.5 h-3.5 text-[#777D76] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                Perishable & non-perishable inventory with Strategy-pattern discounts.
              </p>
            </Card>
          </Link>

          <Link to="/inventory" className="group">
            <Card className="p-4 h-full border-[#E5E4DC] hover:border-[#285943] transition-colors rounded">
              <div className="w-9 h-9 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center mb-2.5">
                <Boxes className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-[#303631] text-sm group-hover:text-[#285943] transition-colors flex items-center justify-between">
                Inventory Audit
                <ArrowRight className="w-3.5 h-3.5 text-[#777D76] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                Stock audit trails, real-time movements, and manual adjustments.
              </p>
            </Card>
          </Link>

          <Link to="/transactions" className="group">
            <Card className="p-4 h-full border-[#E5E4DC] hover:border-[#285943] transition-colors rounded">
              <div className="w-9 h-9 rounded bg-[#EEF5F0] text-[#285943] border border-[#C2D9C8] flex items-center justify-center mb-2.5">
                <Receipt className="w-4 h-4" />
              </div>
              <h4 className="font-semibold text-[#303631] text-sm group-hover:text-[#285943] transition-colors flex items-center justify-between">
                Invoices & Sales
                <ArrowRight className="w-3.5 h-3.5 text-[#777D76] opacity-0 group-hover:opacity-100 transition-opacity" />
              </h4>
              <p className="text-xs text-[#777D76] mt-1 leading-relaxed">
                Historical receipts with immutable unit prices and line totals.
              </p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};
