import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Menu, Search, Lock, Unlock, LogOut, ChevronRight, UserCheck } from 'lucide-react';
import { StatusBadge } from './StatusBadge';
import { useAuth } from '@/context/AuthContext';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AdminUnlockModal } from '@/components/auth/AdminUnlockModal';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
}

const routeTitles: Record<string, { title: string; category: string }> = {
  '/': { title: 'Store Operations Overview', category: 'Store Management' },
  '/billing': { title: 'Point of Sale (POS) Terminal', category: 'Checkout & Sales' },
  '/transactions': { title: 'Sales Receipts & Transactions', category: 'Checkout & Sales' },
  '/products': { title: 'Product Catalog & Pricing', category: 'Inventory & Catalog' },
  '/inventory': { title: 'Stock Control & Audit', category: 'Inventory & Catalog' },
  '/analytics': { title: 'Sales Performance & Analytics', category: 'Store Management' },
  '/admin': { title: 'Store Administration & Master Data', category: 'Store Management' },
  '/oop-concepts': { title: 'System Architecture & Technical Specs', category: 'System Architecture' },
};

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, clearAdminSession } = useAuth();
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const currentRoute = routeTitles[location.pathname] || { title: 'ApexMart Supermarket', category: 'System' };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        navigate('/billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs print:hidden">
        {/* Left: Mobile Toggle & Page Title / Breadcrumbs */}
        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            aria-label="Open navigation sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Link to="/" className="hover:text-slate-900 transition-colors">ApexMart</Link>
              <ChevronRight className="w-3 h-3 text-slate-400" />
              <span className="text-slate-400">{currentRoute.category}</span>
            </div>
            <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight leading-tight">
              {currentRoute.title}
            </h1>
          </div>
        </div>

        {/* Right: Quick Search + Status Indicator + Auth Role Pill */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Quick Jump to POS Scanner */}
          <button
            type="button"
            onClick={() => navigate('/billing')}
            className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200/80 text-slate-400 text-xs w-56 hover:border-slate-300 hover:bg-slate-200/60 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 text-left"
            title="Open POS Terminal & Scan Barcode (Ctrl+K)"
            aria-label="Open POS barcode and SKU search"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span className="flex-1 text-slate-500">Scan Barcode / SKU...</span>
            <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 rounded text-slate-500 shadow-2xs">Ctrl K</kbd>
          </button>

          {/* Backend Connection Health Badge with Latency */}
          <StatusBadge />

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Role & Admin Unlock Indicator */}
          <div className="flex items-center gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <Badge variant="admin" className="gap-1.5 py-1 px-2.5">
                  <Unlock className="w-3.5 h-3.5 text-purple-600" />
                  <span className="hidden sm:inline">Store Manager</span>
                  <span className="sm:hidden">Manager</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAdminSession}
                  className="text-xs text-rose-600 hover:bg-rose-50 hover:border-rose-200 gap-1 px-2.5 py-1"
                  title="Lock manager privileges & return to cashier mode"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="staff" className="gap-1.5 py-1 px-2.5">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">Cashier Terminal</span>
                  <span className="sm:hidden">Cashier</span>
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowUnlockModal(true)}
                  className="text-xs text-slate-700 hover:text-slate-900 gap-1 px-2.5 py-1"
                  title="Unlock store manager administration"
                >
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Manager Login</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin Unlock Modal */}
      <AdminUnlockModal
        isOpen={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
      />
    </>
  );
};
